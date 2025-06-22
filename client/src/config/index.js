// Ghana Regions Data
export const ghanaRegions = [
    { id: "greater-accra", label: "Greater Accra" },
    { id: "ashanti", label: "Ashanti" },
    { id: "western", label: "Western" },
    { id: "central", label: "Central" },
    { id: "eastern", label: "Eastern" },
    { id: "volta", label: "Volta" },
    { id: "northern", label: "Northern" },
    { id: "upper-east", label: "Upper East" },
    { id: "upper-west", label: "Upper West" },
    { id: "brong-ahafo", label: "Brong Ahafo" },
    { id: "western-north", label: "Western North" },
    { id: "ahafo", label: "Ahafo" },
    { id: "bono", label: "Bono" },
    { id: "bono-east", label: "Bono East" },
    { id: "oti", label: "Oti" },
    { id: "savannah", label: "Savannah" },
    { id: "north-east", label: "North East" }
];

export const registerFormControls = [
  {
      name: "userName",
      label: "User Name",
      placeholder: "Enter your user name",
      componentType: "input",
      type: "text",
      required: true,
      minLength: 3,
      validation: {
        required: "Username is required",
        minLength: {
          value: 3,
          message: "Username must be at least 3 characters"
        }
      }
  },
  {
      name: "email",
      label: "Email",
      placeholder: "Enter your email",
      componentType: "input",
      type: "email",
      required: true,
      validation: {
        required: "Email is required",
        pattern: {
          value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
          message: "Please enter a valid email address"
        }
      }
  },
  {
      name: "password",
      label: "Password",
      placeholder: "Enter your password",
      componentType: "input",
      type: "password",
      required: true,
      validation: {
        required: "Password is required",
        minLength: {
          value: 8,
          message: "Password must be at least 8 characters"
        },
        pattern: {
          value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
          message: "Password must include uppercase, lowercase, number and special character"
        }
      },
      helpText: "Password must be at least 8 characters and include uppercase, lowercase, number and special character",
      showPasswordRequirements: true,
      passwordRequirements: [
        { id: "length", text: "At least 8 characters", regex: /.{8,}/ },
        { id: "uppercase", text: "One uppercase letter (A-Z)", regex: /[A-Z]/ },
        { id: "lowercase", text: "One lowercase letter (a-z)", regex: /[a-z]/ },
        { id: "number", text: "One number (0-9)", regex: /\d/ },
        { id: "special", text: "One special character (@$!%*?&)", regex: /[@$!%*?&]/ }
      ]
  },
];

export const loginFormControls = [
  {
      name: "email",
      label: "Email",
      placeholder: "Enter your email",
      componentType: "input",
      type: "email",
      required: true,
      validation: {
        required: "Email is required",
        pattern: {
          value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
          message: "Please enter a valid email address"
        }
      }
  },
  {
      name: "password",
      label: "Password",
      placeholder: "Enter your password",
      componentType: "input",
      type: "password",
      required: true,
      validation: {
        required: "Password is required",
        minLength: {
          value: 6,
          message: "Password must be at least 6 characters"
        }
      }
  },
];

export const addProductFormElements = [
  {
      label: "Title",
      name: "title",
      componentType: "input",
      type: "text",
      placeholder: "Enter product title",
  },
  {
      label: "Description",
      name: "description",
      componentType: "textarea",
      placeholder: "Enter product description",
  },
  {
      label: "Category",
      name: "category",
      componentType: "select",
      options: [
          { id: "men", label: "Men" },
          { id: "women", label: "Women" },
          { id: "kids", label: "Kids" },
          { id: "trousers", label: "Trousers" },
          { id: "accessories", label: "Accessories" },
          { id: "footwear", label: "Footwear" },
          { id: "devices", label: "Devices" },
      ],
  },
  {
      label: "Sub-Category",
      name: "subCategory",
      componentType: "select",
      dynamicOptions: true,
      options: [
          // Men's subcategories
          { id: "men-tshirts", label: "T-Shirts & Tops", categories: ["men"] },
          { id: "men-pants", label: "Pants", categories: ["men"] },
          { id: "men-trousers", label: "Trousers", categories: ["men"] },
          { id: "men-shorts", label: "Shorts", categories: ["men"] },
          { id: "men-hoodies", label: "Hoodies & Sweatshirts", categories: ["men"] },
          { id: "men-jackets", label: "Jackets & Outerwear", categories: ["men"] },
          { id: "men-tracksuits", label: "Tracksuits", categories: ["men"] },
          { id: "men-running", label: "Running", categories: ["men", "footwear"] },
          { id: "men-basketball", label: "Basketball", categories: ["men", "footwear"] },
          { id: "men-training", label: "Training & Gym", categories: ["men", "footwear"] },
          { id: "men-lifestyle", label: "Lifestyle", categories: ["men", "footwear"] },
          { id: "men-soccer", label: "Soccer", categories: ["men", "footwear"] },
          { id: "men-shoes", label: "All Shoes", categories: ["men"] },
          { id: "men-bags", label: "Bags & Backpacks", categories: ["men", "accessories"] },
          { id: "men-hats", label: "Hats & Beanies", categories: ["men", "accessories"] },
          { id: "men-socks", label: "Socks & Underwear", categories: ["men", "accessories"] },
          
          // Women's subcategories
          { id: "women-tshirts", label: "T-Shirts & Tops", categories: ["women"] },
          { id: "women-pants", label: "Pants", categories: ["women"] },
          { id: "women-trousers", label: "Trousers", categories: ["women"] },
          { id: "women-shorts", label: "Shorts", categories: ["women"] },
          { id: "women-hoodies", label: "Hoodies & Sweatshirts", categories: ["women"] },
          { id: "women-jackets", label: "Jackets & Outerwear", categories: ["women"] },
          { id: "women-tracksuits", label: "Tracksuits", categories: ["women"] },
          { id: "women-running", label: "Running", categories: ["women", "footwear"] },
          { id: "women-training", label: "Training & Gym", categories: ["women", "footwear"] },
          { id: "women-lifestyle", label: "Lifestyle", categories: ["women", "footwear"] },
          { id: "women-shoes", label: "All Shoes", categories: ["women"] },
          { id: "women-bags", label: "Bags & Backpacks", categories: ["women", "accessories"] },
          { id: "women-hats", label: "Hats & Beanies", categories: ["women", "accessories"] },
          { id: "women-socks", label: "Socks & Underwear", categories: ["women", "accessories"] },
          
          // Kids subcategories
          { id: "kids-tshirts", label: "T-Shirts & Tops", categories: ["kids"] },
          { id: "kids-pants", label: "Pants", categories: ["kids"] },
          { id: "kids-shorts", label: "Shorts", categories: ["kids"] },
          { id: "kids-hoodies", label: "Hoodies & Sweatshirts", categories: ["kids"] },
          { id: "kids-running", label: "Running", categories: ["kids", "footwear"] },
          { id: "kids-lifestyle", label: "Lifestyle", categories: ["kids", "footwear"] },
          { id: "kids-shoes", label: "All Shoes", categories: ["kids"] },
          { id: "kids-bags", label: "Bags & Backpacks", categories: ["kids", "accessories"] },
          { id: "kids-hats", label: "Hats & Beanies", categories: ["kids", "accessories"] },
          
          // Footwear subcategories
          { id: "footwear-running", label: "Running", categories: ["footwear"] },
          { id: "footwear-basketball", label: "Basketball", categories: ["footwear"] },
          { id: "footwear-training", label: "Training & Gym", categories: ["footwear"] },
          { id: "footwear-lifestyle", label: "Lifestyle", categories: ["footwear"] },
          { id: "footwear-soccer", label: "Soccer", categories: ["footwear"] },
          
          // Accessories subcategories
          { id: "accessories-bags", label: "Bags & Backpacks", categories: ["accessories"] },
          { id: "accessories-hats", label: "Hats & Beanies", categories: ["accessories"] },
          { id: "accessories-socks", label: "Socks & Underwear", categories: ["accessories"] },
          { id: "accessories-equipment", label: "Sports Equipment", categories: ["accessories"] },
          
          // Devices subcategories
          { id: "devices-smartphones", label: "Smartphones", categories: ["devices"] },
          { id: "devices-tablets", label: "Tablets", categories: ["devices"] },
          { id: "devices-laptops", label: "Laptops", categories: ["devices"] },
          { id: "devices-smartwatches", label: "Smartwatches", categories: ["devices"] },
          { id: "devices-headphones", label: "Headphones", categories: ["devices"] },
          { id: "devices-speakers", label: "Speakers", categories: ["devices"] },
      ],
  },
  {
      label: "Gender",
      name: "gender",
      componentType: "select",
      options: [
          { id: "men", label: "Men" },
          { id: "women", label: "Women" },
          { id: "unisex", label: "Unisex" },
      ],
  },
  {
      label: "Brand",
      name: "brand",
      componentType: "select",
      dynamicOptions: true, // Flag to indicate this field has dynamic options based on category
      options: [
          // Clothing and footwear brands
          { id: "nike", label: "Nike", categories: ['men', 'women', 'kids', 'footwear', 'accessories'] },
          { id: "adidas", label: "Adidas", categories: ['men', 'women', 'kids', 'footwear', 'accessories'] },
          { id: "puma", label: "Puma", categories: ['men', 'women', 'kids', 'footwear', 'accessories'] },
          { id: "levi", label: "Levi's", categories: ['men', 'women', 'kids'] },
          { id: "zara", label: "Zara", categories: ['men', 'women', 'kids'] },
          { id: "hm", label: "H&M", categories: ['men', 'women', 'kids'] },
          
          // Tech brands for devices
          { id: "apple", label: "Apple", categories: ['devices'] },
          { id: "samsung", label: "Samsung", categories: ['devices'] },
          { id: "google", label: "Google", categories: ['devices'] },
          { id: "sony", label: "Sony", categories: ['devices'] },
          { id: "microsoft", label: "Microsoft", categories: ['devices'] },
      ],
  },
  {
    name: 'sizes',
    label: 'Sizes',
    componentType: 'multiselect',
    required: false, // Changed to false as it will be conditionally required based on category
    dynamicOptions: true, // Flag to indicate this field has dynamic options based on category
    skipLabel: true, // Skip rendering the label in the form component as it's already shown by the field
    options: [
      // Clothing sizes (shirts, jackets, etc.)
      { id: 'xs', label: 'XS', categories: ['men', 'women', 'kids'] },
      { id: 's', label: 'S', categories: ['men', 'women', 'kids'] },
      { id: 'm', label: 'M', categories: ['men', 'women', 'kids'] },
      { id: 'l', label: 'L', categories: ['men', 'women', 'kids'] },
      { id: 'xl', label: 'XL', categories: ['men', 'women', 'kids'] },
      { id: 'xxl', label: 'XXL', categories: ['men', 'women', 'kids'] },
      
      // Trouser/Pants waist sizes
      { id: 'w28', label: 'W28', categories: ['men', 'women'], subCategory: 'trousers' },
      { id: 'w30', label: 'W30', categories: ['men', 'women'], subCategory: 'trousers' },
      { id: 'w32', label: 'W32', categories: ['men', 'women'], subCategory: 'trousers' },
      { id: 'w34', label: 'W34', categories: ['men', 'women'], subCategory: 'trousers' },
      { id: 'w36', label: 'W36', categories: ['men', 'women'], subCategory: 'trousers' },
      { id: 'w38', label: 'W38', categories: ['men', 'women'], subCategory: 'trousers' },
      { id: 'w40', label: 'W40', categories: ['men', 'women'], subCategory: 'trousers' },
      { id: 'w42', label: 'W42', categories: ['men'], subCategory: 'trousers' },
      { id: 'w44', label: 'W44', categories: ['men'], subCategory: 'trousers' },
      
      // EU Footwear sizes
      { id: 'eu40', label: 'EU 40', categories: ['footwear'] },
      { id: 'eu40.5', label: 'EU 40.5', categories: ['footwear'] },
      { id: 'eu41', label: 'EU 41', categories: ['footwear'] },
      { id: 'eu42', label: 'EU 42', categories: ['footwear'] },
      { id: 'eu42.5', label: 'EU 42.5', categories: ['footwear'] },
      { id: 'eu43', label: 'EU 43', categories: ['footwear'] },
      { id: 'eu44', label: 'EU 44', categories: ['footwear'] },
      { id: 'eu44.5', label: 'EU 44.5', categories: ['footwear'] },
      { id: 'eu45', label: 'EU 45', categories: ['footwear'] },
      { id: 'eu45.5', label: 'EU 45.5', categories: ['footwear'] },
      { id: 'eu46', label: 'EU 46', categories: ['footwear'] },
      { id: 'eu47', label: 'EU 47', categories: ['footwear'] },
      { id: 'eu47.5', label: 'EU 47.5', categories: ['footwear'] },
      { id: 'eu48.5', label: 'EU 48.5', categories: ['footwear'] },
      { id: 'eu49.5', label: 'EU 49.5', categories: ['footwear'] },
      { id: 'eu50.5', label: 'EU 50.5', categories: ['footwear'] },
      
      // Accessories - one size or adjustable options
      { id: 'onesize', label: 'One Size', categories: ['accessories'] },
      { id: 'adjustable', label: 'Adjustable', categories: ['accessories'] },
      { id: 'small', label: 'Small', categories: ['accessories'] },
      { id: 'medium', label: 'Medium', categories: ['accessories'] },
      { id: 'large', label: 'Large', categories: ['accessories'] }
    ]
  },
  {
    name: 'colors',
    label: 'Colors',
    componentType: 'multiselect',
    required: false,
    skipLabel: true, // Skip rendering the label in the form component as it's already shown by the field
    options: [
      // Basic colors
      { id: 'black', label: 'Black' },
      { id: 'white', label: 'White' },
      { id: 'gray', label: 'Gray' },
      { id: 'silver', label: 'Silver' },
      
      // Primary colors
      { id: 'red', label: 'Red' },
      { id: 'blue', label: 'Blue' },
      { id: 'yellow', label: 'Yellow' },
      
      // Secondary colors
      { id: 'green', label: 'Green' },
      { id: 'orange', label: 'Orange' },
      { id: 'purple', label: 'Purple' },
      
      // Additional colors
      { id: 'pink', label: 'Pink' },
      { id: 'brown', label: 'Brown' },
      { id: 'navy', label: 'Navy Blue' },
      { id: 'teal', label: 'Teal' },
      { id: 'gold', label: 'Gold' },
      { id: 'beige', label: 'Beige' },
      { id: 'maroon', label: 'Maroon' },
      { id: 'olive', label: 'Olive' },
      { id: 'khaki', label: 'Khaki' },
      { id: 'coral', label: 'Coral' },
      { id: 'turquoise', label: 'Turquoise' },
      { id: 'multicolor', label: 'Multicolor' }
    ]
  },
  {
      label: "Price",
      name: "price",
      componentType: "input",
      type: "number",
      placeholder: "Enter product price",
  },
  {
      label: "Sale Price",
      name: "salePrice",
      componentType: "input",
      type: "number",
      placeholder: "Enter sale price (optional)",
  },
  {
      label: "Total Stock",
      name: "totalStock",
      componentType: "input",
      type: "number",
      placeholder: "Enter total stock",
  },
];

export const shoppingViewHeaderMenuItems = [    {        id: "products",        label: "All Products",        path: "/shop/listing",    },    {        id: "shops",        label: "Shops",        path: "/shop/shops",    },    {        id: 'men',
        label: 'Men',
        path: '/shop/listing',
        hasSubmenu: true,
        submenu: [
            {
                title: 'Clothing',
                items: [
                    { id: 'men-tshirts', label: 'T-Shirts & Tops', path: '/shop/listing?category=men&subCategory=tshirts' },
                    { id: 'men-pants', label: 'Pants', path: '/shop/listing?category=men&subCategory=pants' },
                    { id: 'men-trousers', label: 'Trousers', path: '/shop/listing?category=men&subCategory=trousers' },
                    { id: 'men-shorts', label: 'Shorts', path: '/shop/listing?category=men&subCategory=shorts' },
                    { id: 'men-hoodies', label: 'Hoodies & Sweatshirts', path: '/shop/listing?category=men&subCategory=hoodies' },
                    { id: 'men-jackets', label: 'Jackets & Outerwear', path: '/shop/listing?category=men&subCategory=jackets' },
                    { id: 'men-tracksuits', label: 'Tracksuits', path: '/shop/listing?category=men&subCategory=tracksuits' },
                    { id: 'men-all', label: 'All Clothing', path: '/shop/listing?category=men' },
                ]
            },
            {
                title: 'Shoes',
                items: [
                    { id: 'men-running', label: 'Running', path: '/shop/listing?category=men&subCategory=running' },
                    { id: 'men-basketball', label: 'Basketball', path: '/shop/listing?category=men&subCategory=basketball' },
                    { id: 'men-training', label: 'Training & Gym', path: '/shop/listing?category=men&subCategory=training' },
                    { id: 'men-lifestyle', label: 'Lifestyle', path: '/shop/listing?category=men&subCategory=lifestyle' },
                    { id: 'men-soccer', label: 'Soccer', path: '/shop/listing?category=men&subCategory=soccer' },
                    { id: 'men-all-shoes', label: 'All Shoes', path: '/shop/listing?category=men&subCategory=shoes' },
                ]
            },
            {
                title: 'Accessories',
                items: [
                    { id: 'men-bags', label: 'Bags & Backpacks', path: '/shop/listing?category=men&subCategory=bags' },
                    { id: 'men-hats', label: 'Hats & Beanies', path: '/shop/listing?category=men&subCategory=hats' },
                    { id: 'men-socks', label: 'Socks & Underwear', path: '/shop/listing?category=men&subCategory=socks' },
                    { id: 'men-all-accessories', label: 'All Accessories', path: '/shop/listing?category=men&subCategory=accessories' },
                ]
            }
        ]
    },
    {
        id: 'women',
        label: 'Women',
        path: '/shop/listing',
        hasSubmenu: true,
        submenu: [
            {
                title: 'Clothing',
                items: [
                    { id: 'women-tshirts', label: 'T-Shirts & Tops', path: '/shop/listing?category=women&subCategory=tshirts' },
                    { id: 'women-pants', label: 'Pants', path: '/shop/listing?category=women&subCategory=pants' },
                    { id: 'women-trousers', label: 'Trousers', path: '/shop/listing?category=women&subCategory=trousers' },
                    { id: 'women-shorts', label: 'Shorts', path: '/shop/listing?category=women&subCategory=shorts' },
                    { id: 'women-hoodies', label: 'Hoodies & Sweatshirts', path: '/shop/listing?category=women&subCategory=hoodies' },
                    { id: 'women-jackets', label: 'Jackets & Outerwear', path: '/shop/listing?category=women&subCategory=jackets' },
                    { id: 'women-tracksuits', label: 'Tracksuits', path: '/shop/listing?category=women&subCategory=tracksuits' },
                    { id: 'women-all', label: 'All Clothing', path: '/shop/listing?category=women' },
                ]
            },
            {
                title: 'Shoes',
                items: [
                    { id: 'women-running', label: 'Running', path: '/shop/listing?category=women&subCategory=running' },
                    { id: 'women-training', label: 'Training & Gym', path: '/shop/listing?category=women&subCategory=training' },
                    { id: 'women-lifestyle', label: 'Lifestyle', path: '/shop/listing?category=women&subCategory=lifestyle' },
                    { id: 'women-all-shoes', label: 'All Shoes', path: '/shop/listing?category=women&subCategory=shoes' },
                ]
            },
            {
                title: 'Accessories',
                items: [
                    { id: 'women-bags', label: 'Bags & Backpacks', path: '/shop/listing?category=women&subCategory=bags' },
                    { id: 'women-hats', label: 'Hats & Beanies', path: '/shop/listing?category=women&subCategory=hats' },
                    { id: 'women-socks', label: 'Socks & Underwear', path: '/shop/listing?category=women&subCategory=socks' },
                    { id: 'women-all-accessories', label: 'All Accessories', path: '/shop/listing?category=women&subCategory=accessories' },
                ]
            }
        ]
    },
    {
        id: 'kids',
        label: 'Kids',
        path: '/shop/listing',
        hasSubmenu: true,
        submenu: [
            {
                title: 'Clothing',
                items: [
                    { id: 'kids-tshirts', label: 'T-Shirts & Tops', path: '/shop/listing?category=kids&subCategory=tshirts' },
                    { id: 'kids-pants', label: 'Pants', path: '/shop/listing?category=kids&subCategory=pants' },
                    { id: 'kids-shorts', label: 'Shorts', path: '/shop/listing?category=kids&subCategory=shorts' },
                    { id: 'kids-hoodies', label: 'Hoodies & Sweatshirts', path: '/shop/listing?category=kids&subCategory=hoodies' },
                    { id: 'kids-all', label: 'All Clothing', path: '/shop/listing?category=kids' },
                ]
            },
            {
                title: 'Shoes',
                items: [
                    { id: 'kids-running', label: 'Running', path: '/shop/listing?category=kids&subCategory=running' },
                    { id: 'kids-lifestyle', label: 'Lifestyle', path: '/shop/listing?category=kids&subCategory=lifestyle' },
                    { id: 'kids-all-shoes', label: 'All Shoes', path: '/shop/listing?category=kids&subCategory=shoes' },
                ]
            },
            {
                title: 'Accessories',
                items: [
                    { id: 'kids-bags', label: 'Bags & Backpacks', path: '/shop/listing?category=kids&subCategory=bags' },
                    { id: 'kids-hats', label: 'Hats & Beanies', path: '/shop/listing?category=kids&subCategory=hats' },
                    { id: 'kids-all-accessories', label: 'All Accessories', path: '/shop/listing?category=kids&subCategory=accessories' },
                ]
            }
        ]
    },
    {
        id: 'accessories',
        label: 'Accessories',
        path: '/shop/listing',
        hasSubmenu: true,
        submenu: [
            {
                title: 'Categories',
                items: [
                    { id: 'accessories-bags', label: 'Bags & Backpacks', path: '/shop/listing?category=accessories&subCategory=bags' },
                    { id: 'accessories-hats', label: 'Hats & Beanies', path: '/shop/listing?category=accessories&subCategory=hats' },
                    { id: 'accessories-socks', label: 'Socks & Underwear', path: '/shop/listing?category=accessories&subCategory=socks' },
                    { id: 'accessories-equipment', label: 'Sports Equipment', path: '/shop/listing?category=accessories&subCategory=equipment' },
                    { id: 'accessories-all', label: 'All Accessories', path: '/shop/listing?category=accessories' },
                ]
            }
        ]
    },
    {
        id: 'footwear',
        label: 'Footwear',
        path: '/shop/listing',
        hasSubmenu: true,
        submenu: [
            {
                title: 'Categories',
                items: [
                    { id: 'footwear-running', label: 'Running', path: '/shop/listing?category=footwear&subCategory=running' },
                    { id: 'footwear-basketball', label: 'Basketball', path: '/shop/listing?category=footwear&subCategory=basketball' },
                    { id: 'footwear-training', label: 'Training & Gym', path: '/shop/listing?category=footwear&subCategory=training' },
                    { id: 'footwear-lifestyle', label: 'Lifestyle', path: '/shop/listing?category=footwear&subCategory=lifestyle' },
                    { id: 'footwear-soccer', label: 'Soccer', path: '/shop/listing?category=footwear&subCategory=soccer' },
                    { id: 'footwear-all', label: 'All Footwear', path: '/shop/listing?category=footwear' },
                ]
            }
        ]
    },
    {
        id: "devices",
        label: "Devices",
        path: "/shop/listing",
        hasSubmenu: true,
        submenu: [
            {
                title: 'Categories',
                items: [
                    { id: 'devices-smartphones', label: 'Smartphones', path: '/shop/listing?category=devices&subCategory=smartphones' },
                    { id: 'devices-tablets', label: 'Tablets', path: '/shop/listing?category=devices&subCategory=tablets' },
                    { id: 'devices-laptops', label: 'Laptops', path: '/shop/listing?category=devices&subCategory=laptops' },
                    { id: 'devices-smartwatches', label: 'Smartwatches', path: '/shop/listing?category=devices&subCategory=smartwatches' },
                    { id: 'devices-headphones', label: 'Headphones', path: '/shop/listing?category=devices&subCategory=headphones' },
                    { id: 'devices-speakers', label: 'Speakers', path: '/shop/listing?category=devices&subCategory=speakers' },
                    { id: 'devices-all', label: 'All Devices', path: '/shop/listing?category=devices' },
                ]
            },
            {
                title: 'Brands',
                items: [
                    { id: 'devices-apple', label: 'Apple', path: '/shop/listing?category=devices&brand=apple' },
                    { id: 'devices-samsung', label: 'Samsung', path: '/shop/listing?category=devices&brand=samsung' },
                    { id: 'devices-google', label: 'Google', path: '/shop/listing?category=devices&brand=google' },
                    { id: 'devices-sony', label: 'Sony', path: '/shop/listing?category=devices&brand=sony' },
                    { id: 'devices-microsoft', label: 'Microsoft', path: '/shop/listing?category=devices&brand=microsoft' },
                ]
            }
        ]
    },
];

export const categoryOptionsMap = {
    'men' : 'Men',
    'women' : 'Women',
    'kids' : "Kids",
    'accessories' : "Accessories",
    'footwear' : 'Footwear'
}

export const brandOptionsMap = {
    'nike' : 'Nike',
    'adidas' : 'Adidas',
    'puma' : "Puma",
    'levi' : "Levi's",
    'zara' : 'Zara',
    'h&m' : 'H&M'
}

export const filterOptions = {
    category: [
      { id: "men", label: "Men" },
      { id: "women", label: "Women" },
      { id: "kids", label: "Kids" },
      { id: "accessories", label: "Accessories" },
      { id: "footwear", label: "Footwear" },
      { id: "devices", label: "Devices" },
    ],
    shop: [
      // This will be dynamically populated from the API
    ],
    price: [
      { id: "0-50", label: "Under GHS 50" },
      { id: "50-100", label: "GHS 50 - GHS 100" },
      { id: "100-200", label: "GHS 100 - GHS 200" },
      { id: "200-500", label: "GHS 200 - GHS 500" },
      { id: "500-1000", label: "GHS 500 - GHS 1000" },
      { id: "1000+", label: "Above GHS 1000" },
    ],
    // Subcategories for Men
    "men-subcategory": [
      { id: "tshirts", label: "T-Shirts & Tops" },
      { id: "pants", label: "Pants" },
      { id: "trousers", label: "Trousers" },
      { id: "shorts", label: "Shorts" },
      { id: "hoodies", label: "Hoodies & Sweatshirts" },
      { id: "jackets", label: "Jackets & Outerwear" },
      { id: "tracksuits", label: "Tracksuits" },
      { id: "running", label: "Running" },
      { id: "basketball", label: "Basketball" },
      { id: "training", label: "Training & Gym" },
      { id: "lifestyle", label: "Lifestyle" },
      { id: "soccer", label: "Soccer" },
      { id: "shoes", label: "All Shoes" },
    ],
    // Subcategories for Women
    "women-subcategory": [
      { id: "tshirts", label: "T-Shirts & Tops" },
      { id: "pants", label: "Pants" },
      { id: "trousers", label: "Trousers" },
      { id: "shorts", label: "Shorts" },
      { id: "hoodies", label: "Hoodies & Sweatshirts" },
      { id: "jackets", label: "Jackets & Outerwear" },
      { id: "tracksuits", label: "Tracksuits" },
      { id: "running", label: "Running" },
      { id: "training", label: "Training & Gym" },
      { id: "lifestyle", label: "Lifestyle" },
      { id: "shoes", label: "All Shoes" },
    ],
    // Subcategories for Kids
    "kids-subcategory": [
      { id: "tshirts", label: "T-Shirts & Tops" },
      { id: "pants", label: "Pants" },
      { id: "shorts", label: "Shorts" },
      { id: "hoodies", label: "Hoodies & Sweatshirts" },
      { id: "running", label: "Running" },
      { id: "lifestyle", label: "Lifestyle" },
      { id: "shoes", label: "All Shoes" },
    ],
    // Subcategories for Accessories
    "accessories-subcategory": [
      { id: "bags", label: "Bags & Backpacks" },
      { id: "hats", label: "Hats & Beanies" },
      { id: "socks", label: "Socks & Underwear" },
      { id: "equipment", label: "Sports Equipment" },
    ],
    // Subcategories for Footwear
    "footwear-subcategory": [
      { id: "running", label: "Running" },
      { id: "basketball", label: "Basketball" },
      { id: "training", label: "Training & Gym" },
      { id: "lifestyle", label: "Lifestyle" },
      { id: "soccer", label: "Soccer" },
    ],
    // Subcategories for Devices
    "devices-subcategory": [
      { id: "smartphones", label: "Smartphones" },
      { id: "tablets", label: "Tablets" },
      { id: "laptops", label: "Laptops" },
      { id: "smartwatches", label: "Smartwatches" },
      { id: "headphones", label: "Headphones" },
      { id: "speakers", label: "Speakers" },
    ],
    // All brands
    brand: [
      { id: "nike", label: "Nike" },
      { id: "adidas", label: "Adidas" },
      { id: "puma", label: "Puma" },
      { id: "levi", label: "Levi's" },
      { id: "zara", label: "Zara" },
      { id: "h&m", label: "H&M" },
      { id: "apple", label: "Apple" },
      { id: "samsung", label: "Samsung" },
      { id: "google", label: "Google" },
      { id: "sony", label: "Sony" },
      { id: "microsoft", label: "Microsoft" },
    ],
    // Category-specific brands
    "men-brands": [
      { id: "nike", label: "Nike" },
      { id: "adidas", label: "Adidas" },
      { id: "puma", label: "Puma" },
      { id: "levi", label: "Levi's" },
      { id: "zara", label: "Zara" },
      { id: "h&m", label: "H&M" },
    ],
    "women-brands": [
      { id: "nike", label: "Nike" },
      { id: "adidas", label: "Adidas" },
      { id: "puma", label: "Puma" },
      { id: "levi", label: "Levi's" },
      { id: "zara", label: "Zara" },
      { id: "h&m", label: "H&M" },
    ],
    "kids-brands": [
      { id: "nike", label: "Nike" },
      { id: "adidas", label: "Adidas" },
      { id: "puma", label: "Puma" },
      { id: "h&m", label: "H&M" },
    ],
    "accessories-brands": [
      { id: "nike", label: "Nike" },
      { id: "adidas", label: "Adidas" },
      { id: "puma", label: "Puma" },
    ],
    "footwear-brands": [
      { id: "nike", label: "Nike" },
      { id: "adidas", label: "Adidas" },
      { id: "puma", label: "Puma" },
    ],
    "devices-brands": [
      { id: "apple", label: "Apple" },
      { id: "samsung", label: "Samsung" },
      { id: "google", label: "Google" },
      { id: "sony", label: "Sony" },
      { id: "microsoft", label: "Microsoft" },
    ],
};

export const sortOptions = [
    { id: "price-lowtohigh", label: "Price: Low to High" },
    { id: "price-hightolow", label: "Price: High to Low" },
    { id: "title-atoz", label: "Title: A to Z" },
    { id: "title-ztoa", label: "Title: Z to A" },
];


export const addressFormControls = [
    {
        label: "Name",
        name: "customerName",
        componentType: "input",
        type: "text",
        placeholder: "Enter your full name",
        required: true
    },
    {
        label: "Region",
        name: "region",
        componentType: "select",
        placeholder: "Select your region",
        required: true,
        options: ghanaRegions
    },
    {
        label: "Address",
        name: "address",
        componentType: "input",
        type: "text",
        placeholder: "Enter your address",
        required: true
    },
    {
        label: "City",
        name: "city",
        componentType: "input",
        type: "text",
        placeholder: "Enter your city",
        required: true
    },
    {
        label: "Phone",
        name: "phone",
        componentType: "input",
        type: "text",
        placeholder: "Enter your phone number",
        required: true
    },
    {
        label: "Notes",
        name: "notes",
        componentType: "textarea",
        placeholder: "Enter any additional notes"
    }
];

