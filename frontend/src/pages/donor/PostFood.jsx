
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { donorService } from '../../services/donorService';
import LocationPicker from '../../components/LocationPicker';
import ImageUpload from '../../components/ImageUpload';
import Button from '../../components/Button';
import ErrorMessage from '../../components/ErrorMessage';

const PostFood = () => {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [foodType, setFoodType] = useState('Cooked Meals');
  const [quantity, setQuantity] = useState('');

  const [pickupAddress, setPickupAddress] = useState('');
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);

  const [imageFile, setImageFile] = useState(null);
  const [prepTime, setPrepTime] = useState('');
  const [expiryTime, setExpiryTime] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate pickup location
    if (
      !pickupAddress.trim() ||
      latitude === null ||
      longitude === null ||
      !Number.isFinite(Number(latitude)) ||
      !Number.isFinite(Number(longitude)) ||
      Number(latitude) < -90 ||
      Number(latitude) > 90 ||
      Number(longitude) < -180 ||
      Number(longitude) > 180
    ) {
      setError('Please select a valid pickup address and location on the map.');
      return;
    }

    // Validate expiry time
    if (!expiryTime) {
      setError('Please select the food expiry time.');
      return;
    }

    const expiryDate = new Date(expiryTime);

    if (Number.isNaN(expiryDate.getTime())) {
      setError('Please enter a valid expiry time.');
      return;
    }

    if (prepTime) {
      const prepDate = new Date(prepTime);

      if (Number.isNaN(prepDate.getTime())) {
        setError('Please enter a valid preparation time.');
        return;
      }

      if (prepDate > expiryDate) {
        setError('Preparation time cannot be later than expiry time.');
        return;
      }
    }

    setLoading(true);

    try {
      const formData = new FormData();

      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('food_type', foodType);
      formData.append('quantity', quantity.trim());
      formData.append('pickup_address', pickupAddress.trim());
      formData.append('latitude', String(Number(latitude)));
      formData.append('longitude', String(Number(longitude)));

      if (prepTime) {
        formData.append(
          'prep_time',
          new Date(prepTime).toISOString()
        );
      }

      formData.append(
        'expiry_time',
        expiryDate.toISOString()
      );

      if (imageFile) {
        formData.append('image', imageFile);
      }

      const res = await donorService.postFood(formData);

      if (res?.success) {
        navigate('/donor/donations');
      } else {
        setError(res?.message || 'Failed to post food donation.');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong while posting the donation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">
          Post Surplus Food
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Share surplus food with nearby NGOs.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5"
      >
        {error && <ErrorMessage message={error} />}

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            Food Item Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. 50 Meals - Veg Biryani & Rice Bowls"
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 font-medium"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Food Category
            </label>
            <select
              value={foodType}
              onChange={(e) => setFoodType(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 font-medium"
            >
              <option value="Cooked Meals">Cooked Meals</option>
              <option value="Raw Groceries">Raw Groceries</option>
              <option value="Bakery Items">Bakery Items</option>
              <option value="Fruits & Veggies">Fruits & Veggies</option>
              <option value="Packaged Goods">Packaged Goods</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Quantity
            </label>
            <input
              type="text"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="e.g. 50 Meals / 25 kg"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 font-medium"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Prepared At (Optional)
            </label>
            <input
              type="datetime-local"
              value={prepTime}
              onChange={(e) => setPrepTime(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Best Before / Expiry Time
            </label>
            <input
              type="datetime-local"
              value={expiryTime}
              onChange={(e) => setExpiryTime(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
              required
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Food past its expiry time should not be available for NGO requests.
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            Food Description / Notes
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ingredients, preparation time, packaging, or handling instructions..."
            rows={3}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 font-medium"
          />
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-2">
            Food Pickup Location
          </h3>

          <LocationPicker
            address={pickupAddress}
            setAddress={setPickupAddress}
            latitude={latitude}
            setLatitude={setLatitude}
            longitude={longitude}
            setLongitude={setLongitude}
          />

          <p className="text-xs text-slate-500 mt-2">
            Select your actual pickup location. Do not use another location's coordinates.
          </p>
        </div>

        <ImageUpload
          onChange={setImageFile}
          label="Food Photo (Camera Capture or File Upload)"
        />

        <div className="pt-2 flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/donor/dashboard')}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5"
          >
            {loading ? 'Posting Surplus Food...' : 'Submit Food Donation'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default PostFood;
