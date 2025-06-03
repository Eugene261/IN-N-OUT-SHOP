import {createAsyncThunk, createSlice} from "@reduxjs/toolkit"
import axios from "axios";

// Define the API base URL using Vite's environment variable syntax
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const initialState = {
    isLoading: false,
    uploadLoading: false,
    deleteLoading: false,
    uploadError: null,
    deleteError: null,
    FeatureImageList: []
}

export const getFeatureImages = createAsyncThunk(
    'common/getFeatureImages',  
    async (_, { rejectWithValue }) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/common/feature/get`);
            return response?.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: "Failed to fetch feature images" });
        }
    }
);

export const addFeatureImage = createAsyncThunk(
    'common/addFeatureImage',  
    async (imageData, { rejectWithValue }) => {
        try {
            let response;
            
            // Check if we're dealing with a File object or a string URL
            if (imageData instanceof File) {
                // It's a File object, use FormData
                const formData = new FormData();
                formData.append('my_file', imageData);
                
                response = await axios.post(
                    `${API_BASE_URL}/api/common/feature/add`, 
                    formData,
                    {
                        headers: {
                            'Content-Type': 'multipart/form-data'
                        }
                    }
                );
            } else {
                // It's a string (URL or base64), send as JSON
                response = await axios.post(
                    `${API_BASE_URL}/api/common/feature/add`, 
                    { image: imageData }
                );
            }
            
            return response?.data;
        } catch (error) {
            console.error("Error uploading image:", error);
            return rejectWithValue(error.response?.data || { message: "Failed to upload feature image" });
        }
    }
);

export const deleteFeatureImage = createAsyncThunk(
    'common/deleteFeatureImage',
    async (imageId, { rejectWithValue }) => {
        try {
            const response = await axios.delete(`${API_BASE_URL}/api/common/feature/delete/${imageId}`);
            return { ...response.data, imageId };
        } catch (error) {
            console.error("Error deleting image:", error);
            return rejectWithValue(error.response?.data || { message: "Failed to delete feature image" });
        }
    }
);

const commonSlice = createSlice({
    name: 'commonSlice',
    initialState,
    reducers: {
        clearUploadError: (state) => {
            state.uploadError = null;
        },
        clearDeleteError: (state) => {
            state.deleteError = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Get Feature Images
            .addCase(getFeatureImages.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getFeatureImages.fulfilled, (state, action) => {
                state.isLoading = false;
                state.FeatureImageList = action.payload.data || [];
            })
            .addCase(getFeatureImages.rejected, (state, action) => {
                state.isLoading = false;
                state.FeatureImageList = [];
            })
            
            // Add Feature Image
            .addCase(addFeatureImage.pending, (state) => {
                state.uploadLoading = true;
                state.uploadError = null;
            })
            .addCase(addFeatureImage.fulfilled, (state, action) => {
                state.uploadLoading = false;
                if (action.payload?.data) {
                    state.FeatureImageList = [...state.FeatureImageList, action.payload.data];
                }
            })
            .addCase(addFeatureImage.rejected, (state, action) => {
                state.uploadLoading = false;
                state.uploadError = action.payload?.message || "An error occurred while uploading the image";
            })
            
            // Delete Feature Image
            .addCase(deleteFeatureImage.pending, (state) => {
                state.deleteLoading = true;
                state.deleteError = null;
            })
            .addCase(deleteFeatureImage.fulfilled, (state, action) => {
                state.deleteLoading = false;
                // Remove the deleted image from the list immediately
                state.FeatureImageList = state.FeatureImageList.filter(
                    image => image._id !== action.payload.imageId
                );
                
                // If the list is now empty, ensure it's an empty array rather than undefined
                if (!state.FeatureImageList || state.FeatureImageList.length === 0) {
                    state.FeatureImageList = [];
                }
            })
            .addCase(deleteFeatureImage.rejected, (state, action) => {
                state.deleteLoading = false;
                state.deleteError = action.payload?.message || "An error occurred while deleting the image";
            });
    }
});

export const { clearUploadError, clearDeleteError } = commonSlice.actions;
export default commonSlice.reducer;