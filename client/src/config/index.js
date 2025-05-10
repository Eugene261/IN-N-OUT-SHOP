export const registerFormControls = [
  {
      name: "userName",
      label: "User Name",
      placeholder: "Enter your user name",
      componentType: "input",
      type: "text",
  },
  {
      name: "email",
      label: "Email",
      placeholder: "Enter your email",
      componentType: "input",
      type: "email",
  },
  {
      name: "password",
      label: "Password",
      placeholder: "Enter your password",
      componentType: "input",
      type: "password",
  },
];

export const loginFormControls = [
  {
      name: "email",
      label: "Email",
      placeholder: "Enter your email",
      componentType: "input",
      type: "email",
  },
  {
      name: "password",
      label: "Password",
      placeholder: "Enter your password",
      componentType: "input",
      type: "password",
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
          { id: "accessories", label: "Accessories" },
          { id: "footwear", label: "Footwear" },
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
      options: [
          { id: "nike", label: "Nike" },
          { id: "adidas", label: "Adidas" },
          { id: "puma", label: "Puma" },
          { id: "levi", label: "Levi's" },
          { id: "zara", label: "Zara" },
          { id: "h&m", label: "H&M" },
      ],
  },
  {
    name: 'sizes',
    label: 'Sizes',
    componentType: 'multiselect',
    required: true,
    dynamicOptions: true, // Flag to indicate this field has dynamic options based on category
    options: [
      // Clothing sizes
      { id: 'xs', label: 'XS', categories: ['men', 'women', 'kids'] },
      { id: 's', label: 'S', categories: ['men', 'women', 'kids'] },
      { id: 'm', label: 'M', categories: ['men', 'women', 'kids'] },
      { id: 'l', label: 'L', categories: ['men', 'women', 'kids'] },
      { id: 'xl', label: 'XL', categories: ['men', 'women', 'kids'] },
      { id: 'xxl', label: 'XXL', categories: ['men', 'women', 'kids'] },
      
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
    required: true,
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

export const shoppingViewHeaderMenuItems = [
    {
        id : 'home',
        label : 'Home',
        path : '/shop/home'
    },
    {
        id: "products",
        label: "Products",
        path: "/shop/listing",
      },
    {
        id : 'men',
        label : 'Men',
        path : '/shop/listing'
    },
    {
        id : 'women',
        label : 'Women',
        path : '/shop/listing'
    },
    {
        id : 'kids',
        label : 'Kids',
        path : '/shop/listing'
    },
    {
        id : 'accessories',
        label : 'Accessories',
        path : '/shop/listing'
    },
    {
        id : 'footwear',
        label : 'Footwear',
        path : '/shop/listing'
    },
    {
        id : 'search',
        label : 'Search',
        path : '/shop/search'
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
    ],
    brand: [
      { id: "nike", label: "Nike" },
      { id: "adidas", label: "Adidas" },
      { id: "puma", label: "Puma" },
      { id: "levi", label: "Levi's" },
      { id: "zara", label: "Zara" },
      { id: "h&m", label: "H&M" },
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
        label: "Region",
        name: "region",
        componentType: "input",
        type: "text",
        placeholder: "Enter your region",
        required: true
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

