import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

interface Props {
  value: string;
  onChange: (v: string) => void;
}

const modules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    [{ color: [] }, { background: [] }],
    ["bold", "italic", "underline"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["blockquote"],
    [{ align: [] }],
    ["clean"],
  ],
};

const formats = [
  "header",
  "color",
  "background",
  "bold",
  "italic",
  "underline",
  "list",
  "bullet",
  "blockquote",
  "align",
];

const RichNoteEditor = ({ value, onChange }: Props) => {
  return <ReactQuill value={value} onChange={onChange} modules={modules} formats={formats} theme="snow" />;
};

export default RichNoteEditor;
