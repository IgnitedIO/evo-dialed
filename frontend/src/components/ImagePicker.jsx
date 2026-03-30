// Dependencies
import { useState } from 'react';
import Compressor from 'compressorjs';

// Style Imports
import styles from "./ImagePicker.module.css";

// Constants
const MAX_FILE_SIZE = 512000; // 500KB = 500b * 1024


// Functional Component
export default function ImagePicker({id=null, onUpdate})
{
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [attemptTooLarge, setAttemptTooLarge] = useState(false);

  // Image picker wrapper
  function handleFileChange(event) {
    setAttemptTooLarge(false);
    const file = event.target.files[0];
		
    if (file && file.size > MAX_FILE_SIZE) {
			setAttemptTooLarge(true);
			return;

		} else if (file) {
      new Compressor(file, {
        quality: 0.6,
        height: 300, maxHeight: 300, minHeight: 300,
        success(compressedFile) {
          setSelectedFile(compressedFile);
          const reader = new FileReader();
          reader.onloadend = () => { setPreview(reader.result); onUpdate(reader.result); };
          reader.readAsDataURL(compressedFile);
        },
        error(err) {
          // TODO: Show error
          console.error(err.message);
        },
      });
    }
  }

  const handleRemove = (e) => {
    e.stopPropagation(); // Prevent triggering the file picker
    setSelectedFile(null);
    setPreview(null);
    onUpdate(null);
  };

	// Return layout
  return (
    <div id={(id === null) ? "" : id} className={styles.picker} onClick={()=>{document.getElementById('ipd-inpdn-b').click()}}>
      <input className={styles.pickerInput} id="ipd-inpdn-b" type="file" accept="image/*" onChange={handleFileChange} />
      <div className={styles.pickerInner}>
        {(preview) ? (
          <>
            <div className={styles.imageContainer}>
              <img className={styles.pickerInnerImage} src={preview} alt="Image Preview" />
              <button 
                className={styles.removeButton} 
                onClick={handleRemove}
                title="Remove image"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
					<path stroke="#fff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="m7 7 5 5m0 0 5 5m-5-5 5-5m-5 5-5 5"/>
				</svg>
              </button>
            </div>
            <h4 className={styles.pickerInnerTitle}>Click again to edit</h4>
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 15.716 15.716">
              <path d="M2.245,3.934a.563.563,0,0,0-.561.561V15.721a.563.563,0,0,0,.561.561H13.471a.563.563,0,0,0,.561-.561V4.5a.563.563,0,0,0-.561-.561ZM0,4.5A2.247,2.247,0,0,1,2.245,2.25H13.471A2.247,2.247,0,0,1,15.716,4.5V15.721a2.247,2.247,0,0,1-2.245,2.245H2.245A2.247,2.247,0,0,1,0,15.721Zm7.016,8.7V10.95H4.771a.842.842,0,0,1,0-1.684H7.016V7.021a.842.842,0,0,1,1.684,0V9.266h2.245a.842.842,0,0,1,0,1.684H8.7v2.245a.842.842,0,0,1-1.684,0Z" transform="translate(0 -2.25)" fill="var(--main-hl)" />
            </svg>
            <h4 className={styles.pickerInnerTitle}>Click to upload</h4>
          </>
        )}
        {(attemptTooLarge) && <h4 className={styles.pickerInnerTitle + " " + styles.error}>Please select a file smaller than 300 KB.</h4>}
      </div>
    </div>
  );
}