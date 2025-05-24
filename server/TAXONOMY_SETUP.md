# 🗃️ Taxonomy System Setup Guide

This guide will help you populate your e-commerce taxonomy system with comprehensive categories, subcategories, brands, sizes, and colors.

## 📋 Prerequisites

Before running the taxonomy population script, ensure you have:

1. **MongoDB Database**: Your MongoDB instance should be running
2. **Environment Variables**: Your `.env` file should contain the correct database connection string
3. **Node.js**: Make sure you're in the server directory

## 🚀 Quick Setup

### 1. Navigate to Server Directory
```bash
cd server
```

### 2. Install Dependencies (if not already installed)
```bash
npm install
```

### 3. Set Up Environment Variables
Make sure your `server/.env` file contains:
```env
MONGODB_URI=mongodb://localhost:27017/your-ecommerce-db
# Replace with your actual MongoDB connection string
```

### 4. Run the Taxonomy Population Script
```bash
npm run populate-taxonomy
```

## 📊 What Gets Created

The script will populate your database with:

### 📁 **Categories (6 main categories)**
- **Men** - Men's clothing, shoes, and accessories
- **Women** - Women's clothing, shoes, and accessories  
- **Kids** - Children's clothing, shoes, and accessories
- **Accessories** - Bags, hats, belts, and other accessories
- **Footwear** - Shoes and sneakers for all occasions
- **Devices** - Electronics and gadgets

### 📂 **Subcategories (30+ subcategories)**
Including:
- **Men's**: T-Shirts & Tops, Pants, Trousers, Shorts, Hoodies, Jackets, Tracksuits
- **Women's**: T-Shirts & Tops, Pants, Trousers, Shorts, Hoodies, Jackets, Tracksuits, Dresses, Skirts
- **Kids**: T-Shirts & Tops, Pants, Shorts, Hoodies, Dresses
- **Footwear**: Running, Basketball, Training & Gym, Lifestyle, Soccer, Casual Shoes, Formal Shoes
- **Accessories**: Bags & Backpacks, Hats & Beanies, Socks & Underwear, Sports Equipment, Belts, Jewelry
- **Devices**: Smartphones, Tablets, Laptops, Smartwatches, Headphones, Speakers

### 🏷️ **Brands (17 popular brands)**
**Fashion Brands:**
- Nike, Adidas, Puma, Levi's, Zara, H&M, Uniqlo, Under Armour, Calvin Klein, Tommy Hilfiger

**Tech Brands:**  
- Apple, Samsung, Google, Sony, Microsoft, Huawei, OnePlus

### 📏 **Sizes (35+ size options)**
- **Clothing**: XS, S, M, L, XL, XXL, 3XL
- **Trousers**: W28, W30, W32, W34, W36, W38, W40, W42
- **Footwear**: EU 36-47
- **Accessories**: One Size, Adjustable, Small, Medium, Large

### 🎨 **Colors (20+ colors)**
Including popular options like:
- **Neutrals**: Black, White, Gray, Silver, Navy, Beige
- **Primary**: Red, Blue, Yellow
- **Secondary**: Green, Orange, Purple
- **Popular**: Pink, Brown, Teal, Maroon, Olive, Gold, Coral, Turquoise, Khaki, Multicolor

## 🔄 Re-running the Script

**⚠️ Warning**: The script will **DELETE ALL EXISTING** taxonomy data before creating new entries.

If you need to re-run the script:
```bash
npm run populate-taxonomy
```

This will:
1. Clear all existing categories, subcategories, brands, sizes, and colors
2. Create fresh data from the script

## ✅ Verification

After running the script, you can verify the data was created by:

1. **Check your taxonomy management page** in the Super Admin panel
2. **Try creating a product** - you should see all the new options available
3. **Check the shopping filters** - categories and brands should appear

## 🛠️ Customization

To modify the taxonomy data:

1. **Edit the script**: `server/scripts/populateTaxonomy.js`
2. **Modify the data arrays**:
   - `categoriesData` - Add/remove categories
   - `subcategoriesData` - Add/remove subcategories  
   - `brandsData` - Add/remove brands
   - `sizesData` - Add/remove sizes
   - `colorsData` - Add/remove colors
3. **Re-run the script**: `npm run populate-taxonomy`

## 🔧 Troubleshooting

### Database Connection Issues
```bash
Error: Database connection error
```
**Solution**: Check your `MONGODB_URI` in the `.env` file

### Missing Models Error
```bash
Error: Cannot find module '../models/Category'
```
**Solution**: Make sure you're running the script from the `server` directory

### Permission Issues
```bash
Error: EACCES: permission denied
```
**Solution**: Make sure you have write permissions to the database

## 📱 After Setup

Once the taxonomy is populated, you can:

1. **Create products** with proper categories and subcategories
2. **Use filters** in the shopping interface
3. **Manage taxonomy** through the Super Admin panel
4. **Add more items** as needed through the web interface

## 🎉 Success!

Your taxonomy system is now ready for a full e-commerce experience with:
- ✅ Complete category hierarchy
- ✅ Brand management
- ✅ Size variations
- ✅ Color options
- ✅ Dynamic product forms
- ✅ Smart filtering system

Happy selling! 🛒 