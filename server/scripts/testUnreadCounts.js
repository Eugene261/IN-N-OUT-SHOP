const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');
const User = require('../models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function addTestUnreadCounts() {
  try {
    console.log('🔍 Adding test unread counts to conversations...');
    
    // Find all conversations
    const conversations = await Conversation.find({})
      .populate('participants.user', 'userName email role');
    
    console.log(`Found ${conversations.length} conversations`);
    
    for (const conversation of conversations) {
      console.log(`\n📝 Processing conversation: ${conversation.title}`);
      console.log('Participants:', conversation.participants.map(p => ({
        userId: p.user._id,
        userName: p.user.userName,
        role: p.user.role
      })));
      
      // Add test unread counts for each participant
      conversation.unreadCounts = conversation.participants.map(participant => ({
        user: participant.user._id,
        count: Math.floor(Math.random() * 5) + 1 // Random count between 1-5
      }));
      
      await conversation.save();
      
      console.log('✅ Added unread counts:', conversation.unreadCounts.map(uc => ({
        userId: uc.user,
        count: uc.count
      })));
    }
    
    console.log('\n🎉 Test unread counts added to all conversations!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding test unread counts:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  addTestUnreadCounts();
}

module.exports = addTestUnreadCounts; 