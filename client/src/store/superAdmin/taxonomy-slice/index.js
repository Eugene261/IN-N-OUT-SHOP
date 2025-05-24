import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';

const initialState = {
  categories: [],
  subcategories: [],
  brands: [],
  sizes: [],
  colors: [],
  allTaxonomyData: null,
  isLoading: false,
  error: null
};

// ================== CATEGORIES ==================

export const fetchCategories = createAsyncThunk(
  'taxonomy/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/api/superAdmin/taxonomy/categories');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch categories');
    }
  }
);

export const createCategory = createAsyncThunk(
  'taxonomy/createCategory',
  async (categoryData, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/superAdmin/taxonomy/categories', categoryData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create category');
    }
  }
);

export const updateCategory = createAsyncThunk(
  'taxonomy/updateCategory',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`/api/superAdmin/taxonomy/categories/${id}`, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update category');
    }
  }
);

export const deleteCategory = createAsyncThunk(
  'taxonomy/deleteCategory',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.delete(`/api/superAdmin/taxonomy/categories/${id}`);
      return { ...response.data, id };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete category');
    }
  }
);

// ================== SUBCATEGORIES ==================

export const fetchSubcategories = createAsyncThunk(
  'taxonomy/fetchSubcategories',
  async (categoryId = null, { rejectWithValue }) => {
    try {
      const url = categoryId 
        ? `/api/superAdmin/taxonomy/subcategories?categoryId=${categoryId}`
        : `/api/superAdmin/taxonomy/subcategories`;
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch subcategories');
    }
  }
);

export const createSubcategory = createAsyncThunk(
  'taxonomy/createSubcategory',
  async (subcategoryData, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/superAdmin/taxonomy/subcategories', subcategoryData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create subcategory');
    }
  }
);

export const updateSubcategory = createAsyncThunk(
  'taxonomy/updateSubcategory',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`/api/superAdmin/taxonomy/subcategories/${id}`, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update subcategory');
    }
  }
);

export const deleteSubcategory = createAsyncThunk(
  'taxonomy/deleteSubcategory',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.delete(`/api/superAdmin/taxonomy/subcategories/${id}`);
      return { ...response.data, id };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete subcategory');
    }
  }
);

// ================== BRANDS ==================

export const fetchBrands = createAsyncThunk(
  'taxonomy/fetchBrands',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/api/superAdmin/taxonomy/brands');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch brands');
    }
  }
);

export const createBrand = createAsyncThunk(
  'taxonomy/createBrand',
  async (brandData, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/superAdmin/taxonomy/brands', brandData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create brand');
    }
  }
);

export const updateBrand = createAsyncThunk(
  'taxonomy/updateBrand',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`/api/superAdmin/taxonomy/brands/${id}`, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update brand');
    }
  }
);

export const deleteBrand = createAsyncThunk(
  'taxonomy/deleteBrand',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.delete(`/api/superAdmin/taxonomy/brands/${id}`);
      return { ...response.data, id };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete brand');
    }
  }
);

// ================== SIZES ==================

export const fetchSizes = createAsyncThunk(
  'taxonomy/fetchSizes',
  async (category = null, { rejectWithValue }) => {
    try {
      const url = category 
        ? `/api/superAdmin/taxonomy/sizes?category=${category}`
        : `/api/superAdmin/taxonomy/sizes`;
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch sizes');
    }
  }
);

export const createSize = createAsyncThunk(
  'taxonomy/createSize',
  async (sizeData, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/superAdmin/taxonomy/sizes', sizeData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create size');
    }
  }
);

export const updateSize = createAsyncThunk(
  'taxonomy/updateSize',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`/api/superAdmin/taxonomy/sizes/${id}`, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update size');
    }
  }
);

export const deleteSize = createAsyncThunk(
  'taxonomy/deleteSize',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.delete(`/api/superAdmin/taxonomy/sizes/${id}`);
      return { ...response.data, id };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete size');
    }
  }
);

// ================== COLORS ==================

export const fetchColors = createAsyncThunk(
  'taxonomy/fetchColors',
  async (colorFamily = null, { rejectWithValue }) => {
    try {
      const url = colorFamily 
        ? `/api/superAdmin/taxonomy/colors?colorFamily=${colorFamily}`
        : `/api/superAdmin/taxonomy/colors`;
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch colors');
    }
  }
);

export const createColor = createAsyncThunk(
  'taxonomy/createColor',
  async (colorData, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/superAdmin/taxonomy/colors', colorData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create color');
    }
  }
);

export const updateColor = createAsyncThunk(
  'taxonomy/updateColor',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`/api/superAdmin/taxonomy/colors/${id}`, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update color');
    }
  }
);

export const deleteColor = createAsyncThunk(
  'taxonomy/deleteColor',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.delete(`/api/superAdmin/taxonomy/colors/${id}`);
      return { ...response.data, id };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete color');
    }
  }
);

// ================== BULK OPERATIONS ==================

export const fetchAllTaxonomyData = createAsyncThunk(
  'taxonomy/fetchAllTaxonomyData',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/api/superAdmin/taxonomy/all');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch taxonomy data');
    }
  }
);

const taxonomySlice = createSlice({
  name: 'taxonomy',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearTaxonomyData: (state) => {
      state.categories = [];
      state.subcategories = [];
      state.brands = [];
      state.sizes = [];
      state.colors = [];
      state.allTaxonomyData = null;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Categories
      .addCase(fetchCategories.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.isLoading = false;
        state.categories = action.payload.data;
        state.error = null;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(createCategory.fulfilled, (state, action) => {
        state.categories.push(action.payload.data);
      })
      .addCase(updateCategory.fulfilled, (state, action) => {
        const index = state.categories.findIndex(cat => cat._id === action.payload.data._id);
        if (index !== -1) {
          state.categories[index] = action.payload.data;
        }
      })
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.categories = state.categories.filter(cat => cat._id !== action.payload.id);
      })
      
      // Subcategories
      .addCase(fetchSubcategories.fulfilled, (state, action) => {
        state.subcategories = action.payload.data;
      })
      .addCase(createSubcategory.fulfilled, (state, action) => {
        state.subcategories.push(action.payload.data);
      })
      .addCase(updateSubcategory.fulfilled, (state, action) => {
        const index = state.subcategories.findIndex(sub => sub._id === action.payload.data._id);
        if (index !== -1) {
          state.subcategories[index] = action.payload.data;
        }
      })
      .addCase(deleteSubcategory.fulfilled, (state, action) => {
        state.subcategories = state.subcategories.filter(sub => sub._id !== action.payload.id);
      })
      
      // Brands
      .addCase(fetchBrands.fulfilled, (state, action) => {
        state.brands = action.payload.data;
      })
      .addCase(createBrand.fulfilled, (state, action) => {
        state.brands.push(action.payload.data);
      })
      .addCase(updateBrand.fulfilled, (state, action) => {
        const index = state.brands.findIndex(brand => brand._id === action.payload.data._id);
        if (index !== -1) {
          state.brands[index] = action.payload.data;
        }
      })
      .addCase(deleteBrand.fulfilled, (state, action) => {
        state.brands = state.brands.filter(brand => brand._id !== action.payload.id);
      })
      
      // Sizes
      .addCase(fetchSizes.fulfilled, (state, action) => {
        state.sizes = action.payload.data;
      })
      .addCase(createSize.fulfilled, (state, action) => {
        state.sizes.push(action.payload.data);
      })
      .addCase(updateSize.fulfilled, (state, action) => {
        const index = state.sizes.findIndex(size => size._id === action.payload.data._id);
        if (index !== -1) {
          state.sizes[index] = action.payload.data;
        }
      })
      .addCase(deleteSize.fulfilled, (state, action) => {
        state.sizes = state.sizes.filter(size => size._id !== action.payload.id);
      })
      
      // Colors
      .addCase(fetchColors.fulfilled, (state, action) => {
        state.colors = action.payload.data;
      })
      .addCase(createColor.fulfilled, (state, action) => {
        state.colors.push(action.payload.data);
      })
      .addCase(updateColor.fulfilled, (state, action) => {
        const index = state.colors.findIndex(color => color._id === action.payload.data._id);
        if (index !== -1) {
          state.colors[index] = action.payload.data;
        }
      })
      .addCase(deleteColor.fulfilled, (state, action) => {
        state.colors = state.colors.filter(color => color._id !== action.payload.id);
      })
      
      // Bulk operations
      .addCase(fetchAllTaxonomyData.fulfilled, (state, action) => {
        state.allTaxonomyData = action.payload.data;
        state.categories = action.payload.data.categories;
        state.subcategories = action.payload.data.subcategories;
        state.brands = action.payload.data.brands;
        state.sizes = action.payload.data.sizes;
        state.colors = action.payload.data.colors;
      });
  }
});

export const { clearError, clearTaxonomyData } = taxonomySlice.actions;
export default taxonomySlice.reducer; 