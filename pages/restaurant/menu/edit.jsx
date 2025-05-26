import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import ImageUpload from "../../../components/ImageUpload";

const EditMenuItem = () => {
  const router = useRouter();
  const { rid, dishid } = router.query;
  const [menuItem, setMenuItem] = useState({
    name: "",
    price: "",
    description: "",
    category: "",
    image: "",
    isavailable: true,
    ispopular: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (rid && dishid) {
      fetchMenuItem();
    }
  }, [rid, dishid]);

  const fetchMenuItem = async () => {
    try {
      const response = await axios.get(`/api/menu/${rid}/${dishid}`);
      setMenuItem(response.data);
      setLoading(false);
    } catch (error) {
      setError("載入餐點資料失敗");
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setMenuItem((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleImageUploadSuccess = (imagePath) => {
    setMenuItem((prev) => ({
      ...prev,
      image: imagePath,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await axios.put(`/api/menu/${rid}/${dishid}`, menuItem);
      router.push(`/restaurant/menu?rid=${rid}`);
    } catch (error) {
      setError("更新餐點失敗");
      setLoading(false);
    }
  };

  if (loading) return <div>載入中...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="edit-menu-container">
      <h1>編輯餐點</h1>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>餐點名稱：</label>
          <input
            type="text"
            name="name"
            value={menuItem.name}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label>價格：</label>
          <input
            type="number"
            name="price"
            value={menuItem.price}
            onChange={handleInputChange}
            required
            min="0"
            step="0.01"
          />
        </div>

        <div className="form-group">
          <label>描述：</label>
          <textarea
            name="description"
            value={menuItem.description}
            onChange={handleInputChange}
          />
        </div>

        <div className="form-group">
          <label>類別：</label>
          <select
            name="category"
            value={menuItem.category}
            onChange={handleInputChange}
            required
          >
            <option value="">選擇類別</option>
            <option value="主餐">主餐</option>
            <option value="前菜">前菜</option>
            <option value="湯品">湯品</option>
            <option value="甜點">甜點</option>
            <option value="飲料">飲料</option>
          </select>
        </div>

        <div className="form-group">
          <label>餐點圖片：</label>
          <ImageUpload
            rid={rid}
            dishid={dishid}
            onUploadSuccess={handleImageUploadSuccess}
            currentImage={menuItem.image}
          />
        </div>

        <div className="form-group checkbox">
          <label>
            <input
              type="checkbox"
              name="isavailable"
              checked={menuItem.isavailable}
              onChange={handleInputChange}
            />
            是否供應
          </label>
        </div>

        <div className="form-group checkbox">
          <label>
            <input
              type="checkbox"
              name="ispopular"
              checked={menuItem.ispopular}
              onChange={handleInputChange}
            />
            是否為熱門餐點
          </label>
        </div>

        <div className="form-actions">
          <button type="submit" disabled={loading}>
            {loading ? "儲存中..." : "儲存變更"}
          </button>
          <button type="button" onClick={() => router.back()}>
            取消
          </button>
        </div>
      </form>

      <style jsx>{`
        .edit-menu-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        label {
          display: block;
          margin-bottom: 5px;
          font-weight: bold;
        }

        input[type="text"],
        input[type="number"],
        textarea,
        select {
          width: 100%;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }

        textarea {
          height: 100px;
        }

        .checkbox label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: normal;
        }

        .form-actions {
          display: flex;
          gap: 10px;
          margin-top: 20px;
        }

        button {
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        button[type="submit"] {
          background-color: #4caf50;
          color: white;
        }

        button[type="button"] {
          background-color: #f44336;
          color: white;
        }

        button:disabled {
          background-color: #cccccc;
          cursor: not-allowed;
        }

        .error-message {
          color: #ff0000;
          margin-bottom: 20px;
        }
      `}</style>
    </div>
  );
};

export default EditMenuItem;
