import {createAsyncThunk, createSlice} from "@reduxjs/toolkit"
import axios from "axios";
import { API_BASE_URL } from "@/config/api";

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
            return rejectWithValue(error.response?.data || { message: "Failed to fetch feature media" });
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

// New action for uploading media (images or videos) with metadata
export const addFeatureMedia = createAsyncThunk(
    'common/addFeatureMedia',  
    async (mediaData, { rejectWithValue }) => {
        try {
            let response;
            
            // Check if we're dealing with a File object or media data object
            if (mediaData instanceof File) {
                // It's a File object, use FormData with default settings
                const formData = new FormData();
                formData.append('my_file', mediaData);
                
                response = await axios.post(
                    `${API_BASE_URL}/api/common/feature/add`, 
                    formData,
                    {
                        headers: {
                            'Content-Type': 'multipart/form-data'
                        }
                    }
                );
            } else if (mediaData.file && mediaData.file instanceof File) {
                // It's a media data object with file and metadata
                const formData = new FormData();
                formData.append('my_file', mediaData.file);
                formData.append('mediaType', mediaData.mediaType || 'image');
                if (mediaData.title) formData.append('title', mediaData.title);
                if (mediaData.description) formData.append('description', mediaData.description);
                
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
                // It's a string or object with URL, send as JSON
                response = await axios.post(
                    `${API_BASE_URL}/api/common/feature/add`, 
                    mediaData
                );
            }
            
            return response?.data;
        } catch (error) {
            console.error("Error uploading media:", error);
            return rejectWithValue(error.response?.data || { message: "Failed to upload feature media" });
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
            return rejectWithValue(error.response?.data || { message: "Failed to delete feature media" });
        }
    }
);

// New action for updating media positions
export const updateFeaturePositions = createAsyncThunk(
    'common/updateFeaturePositions',
    async (positions, { rejectWithValue }) => {
        try {
            const response = await axios.put(`${API_BASE_URL}/api/common/feature/positions`, { positions });
            return { ...response.data, positions };
        } catch (error) {
            console.error("Error updating positions:", error);
            return rejectWithValue(error.response?.data || { message: "Failed to update positions" });
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
        },
        reorderFeatureMedia: (state, action) => {
            // Local reordering for immediate UI feedback
            state.FeatureImageList = action.payload;
        }
    },
    extraReducers: (builder) => {
        builder
            // Get Feature Images/Media
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
            
            // Add Feature Image (backwards compatibility)
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
            
            // Add Feature Media (new)
            .addCase(addFeatureMedia.pending, (state) => {
                state.uploadLoading = true;
                state.uploadError = null;
            })
            .addCase(addFeatureMedia.fulfilled, (state, action) => {
                state.uploadLoading = false;
                if (action.payload?.data) {
                    state.FeatureImageList = [...state.FeatureImageList, action.payload.data];
                }
            })
            .addCase(addFeatureMedia.rejected, (state, action) => {
                state.uploadLoading = false;
                state.uploadError = action.payload?.message || "An error occurred while uploading the media";
            })
            
            // Delete Feature Image/Media
            .addCase(deleteFeatureImage.pending, (state) => {
                state.deleteLoading = true;
                state.deleteError = null;
            })
            .addCase(deleteFeatureImage.fulfilled, (state, action) => {
                state.deleteLoading = false;
                // Remove the deleted media from the list immediately
                state.FeatureImageList = state.FeatureImageList.filter(
                    media => media._id !== action.payload.imageId
                );
                
                // If the list is now empty, ensure it's an empty array rather than undefined
                if (!state.FeatureImageList || state.FeatureImageList.length === 0) {
                    state.FeatureImageList = [];
                }
            })
            .addCase(deleteFeatureImage.rejected, (state, action) => {
                state.deleteLoading = false;
                state.deleteError = action.payload?.message || "An error occurred while deleting the media";
            })
            
            // Update Feature Positions
            .addCase(updateFeaturePositions.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(updateFeaturePositions.fulfilled, (state, action) => {
                state.isLoading = false;
                // Positions are already updated locally via reorderFeatureMedia
            })
            .addCase(updateFeaturePositions.rejected, (state, action) => {
                state.isLoading = false;
                // Optionally revert local changes on error
                console.error("Failed to update positions:", action.payload);
            });
    }
});

export const { clearUploadError, clearDeleteError, reorderFeatureMedia } = commonSlice.actions;
export default commonSlice.reducer;