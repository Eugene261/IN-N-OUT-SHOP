const cloudinary = require('cloudinary').v2;
const multer = require('multer');

// Use environment variables for Cloudinary credentials
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dq80s3m4e',
    api_key: process.env.CLOUDINARY_API_KEY || '993987412169513',
    api_secret: process.env.CLOUDINARY_API_SECRET || 'o2DDXYmE8eUDN1L4qWFv1eSQE9s'
});

const storage = new multer.memoryStorage();


async  function ImageUploadUtil(file) {
    const result = await cloudinary.uploader.upload(file, {
        resource_type : 'auto'
    })

    return result;
};

const upload = multer({storage})

module.exports = {
    upload,
    ImageUploadUtil
};