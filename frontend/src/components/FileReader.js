import './FileReader.css';

function FileReader({setParentFileName, setHasSelectedFile}) {
  const handleFileChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      setParentFileName(event.target.files[0].name);
      setHasSelectedFile(true);
    }
  };

  return (
    <div className="FileReader">
      <input type="file" onChange={handleFileChange}></input>
    </div>
  );
}

export default FileReader;