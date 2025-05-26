import React, { useState } from "react";
import axios from "axios";

const ImageUpload = ({ rid, dishid, onUploadSuccess, currentImage }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(currentImage || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // 檢查檔案類型
      if (!file.type.startsWith("image/")) {
        setError("請選擇圖片檔案");
        return;
      }
      // 檢查檔案大小（5MB）
      if (file.size > 5 * 1024 * 1024) {
        setError("圖片大小不能超過 5MB");
        return;
      }

      setSelectedFile(file);
      setError("");

      // 建立預覽
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("請先選擇圖片");
      return;
    }

    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("image", selectedFile);
    if (rid) formData.append("rid", rid);
    if (dishid) formData.append("dishid", dishid);

    try {
      const response = await axios.post("/api/upload/menu-image", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.success) {
        onUploadSuccess(response.data.path);
        setError("");
      }
    } catch (error) {
      setError(error.response?.data?.error || "上傳失敗");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="image-upload-container">
      <div className="preview-container">
        {preview && (
          <img
            src={preview}
            alt="預覽圖"
            className="preview-image"
            style={{ maxWidth: "200px", maxHeight: "200px" }}
          />
        )}
      </div>

      <div className="upload-controls">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="file-input"
          disabled={loading}
        />

        <button
          onClick={handleUpload}
          disabled={!selectedFile || loading}
          className="upload-button"
        >
          {loading ? "上傳中..." : "上傳圖片"}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <style jsx>{`
        .image-upload-container {
          padding: 20px;
          border: 2px dashed #ccc;
          border-radius: 8px;
          margin: 10px 0;
        }

        .preview-container {
          margin-bottom: 15px;
          min-height: 100px;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .preview-image {
          object-fit: contain;
          border-radius: 4px;
        }

        .upload-controls {
          display: flex;
          gap: 10px;
          margin-bottom: 10px;
        }

        .file-input {
          flex: 1;
          padding: 8px;
        }

        .upload-button {
          padding: 8px 16px;
          background-color: #4caf50;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        .upload-button:disabled {
          background-color: #cccccc;
          cursor: not-allowed;
        }

        .error-message {
          color: #ff0000;
          margin-top: 10px;
        }
      `}</style>
    </div>
  );
};

export default ImageUpload;
