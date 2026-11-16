# /// script
# requires-python = ">=3.11"
# dependencies = ["onnx>=1.20,<2"]
# ///
"""Prepare pinned upstream models for WebGPU. Run with uv, not during app builds."""

import hashlib
import json
import sys
from pathlib import Path
from urllib.request import urlopen

import onnx

REVISION = "c582623ea970dffed0c0afaf971ab43bb3356604"
REPOSITORY = "https://huggingface.co/Hoshino-Yumetsuki/Real-CUGAN-ONNX"
ROOT = Path(__file__).resolve().parents[1]
DESTINATION = ROOT / "public" / "models" / REVISION / "webgpu-f32"


def prepare(data: bytes) -> bytes:
    model = onnx.load_model_from_string(data)
    producers = {output: node for node in model.graph.node for output in node.output}
    # Remove PNG byte quantization, preserving crop/clamp and Pro normalization.
    output = model.graph.output[0]
    value = output.name
    for operation in ("Cast", "Clip", "Round"):
        node = producers[value]
        if node.op_type != operation:
            raise ValueError(f"Unexpected output chain: wanted {operation}, got {node.op_type}")
        value = node.input[0]
    multiply = producers[value]
    if multiply.op_type != "Mul":
        raise ValueError("Unexpected float output scale")
    scale_node = producers[multiply.input[1]]
    if scale_node.op_type != "Constant":
        raise ValueError("Expected constant output scale")
    scale = next(attribute.t for attribute in scale_node.attribute if attribute.name == "value")
    scale.CopyFrom(onnx.numpy_helper.from_array(onnx.numpy_helper.to_array(scale) / 255))
    required = set()
    pending = [value]
    while pending:
        name = pending.pop()
        node = producers.get(name)
        if node is not None and node.name not in required:
            required.add(node.name)
            pending.extend(node.input)
    producers[value].output[0] = output.name
    nodes = [node for node in model.graph.node if node.name in required]
    del model.graph.node[:]
    model.graph.node.extend(nodes)
    output.type.tensor_type.elem_type = onnx.TensorProto.FLOAT
    onnx.checker.check_model(model)
    return model.SerializeToString()


def main() -> None:
    with urlopen(f"https://huggingface.co/api/models/Hoshino-Yumetsuki/Real-CUGAN-ONNX/tree/{REVISION}?recursive=true", timeout=60) as response:
        files = json.load(response)
    for entry in files:
        path = entry["path"]
        if not path.endswith(".onnx"):
            continue
        if len(sys.argv) > 1:
            data = (Path(sys.argv[1]) / path).read_bytes()
        else:
            with urlopen(f"{REPOSITORY}/resolve/{REVISION}/{path}", timeout=120) as response:
                data = response.read()
        if hashlib.sha256(data).hexdigest() != entry["lfs"]["oid"]:
            raise ValueError(f"Upstream SHA-256 mismatch: {path}")
        target = DESTINATION / path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(prepare(data))
        print(f"Prepared {path}")


if __name__ == "__main__":
    main()
