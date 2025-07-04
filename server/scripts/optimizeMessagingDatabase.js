const mongoose = require('mongoose');
const Message = require('../models/Message.js');
const Conversation = require('../models/Conversation.js');
require('dotenv').config();

async function optimizeMessagingDatabase() {
  try {
    console.log('🔧 Starting messaging database optimization...');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecom');
    console.log('✅ Connected to database');
    
    // Get collections
    const messageCollection = mongoose.connection.db.collection('messages');
    const conversationCollection = mongoose.connection.db.collection('conversations');
    
    console.log('📊 Current Message indexes:');
    const messageIndexes = await messageCollection.listIndexes().toArray();
    messageIndexes.forEach(index => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });
    
    console.log('\n📊 Current Conversation indexes:');
    const conversationIndexes = await conversationCollection.listIndexes().toArray();
    conversationIndexes.forEach(index => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });
    
    // Add optimized indexes for messaging queries
    console.log('\n🚀 Adding optimized messaging indexes...');
    
    // Message collection indexes
    await messageCollection.createIndex({ conversation: 1, createdAt: -1 }, { 
      name: 'conversation_date_index',
      background: true 
    });
    console.log('✅ Added message conversation + date index');
    
    await messageCollection.createIndex({ sender: 1, createdAt: -1 }, { 
      name: 'sender_date_index',
      background: true 
    });
    console.log('✅ Added message sender + date index');
    
    await messageCollection.createIndex({ 'readBy.user': 1, conversation: 1 }, { 
      name: 'read_by_conversation_index',
      background: true 
    });
    console.log('✅ Added read status index');
    
    await messageCollection.createIndex({ status: 1, createdAt: -1 }, { 
      name: 'status_date_index',
      background: true 
    });
    console.log('✅ Added message status index');
    
    await messageCollection.createIndex({ deletedAt: 1 }, { 
      name: 'deleted_index',
      background: true,
      sparse: true 
    });
    console.log('✅ Added deleted message index');
    
    // Conversation collection indexes
    await conversationCollection.createIndex({ 'participants.user': 1, status: 1 }, { 
      name: 'participants_status_index',
      background: true 
    });
    console.log('✅ Added conversation participants + status index');
    
    await conversationCollection.createIndex({ 'lastMessage.sentAt': -1, status: 1 }, { 
      name: 'last_message_status_index',
      background: true 
    });
    console.log('✅ Added last message + status index');
    
    await conversationCollection.createIndex({ 'unreadCounts.user': 1, 'unreadCounts.count': 1 }, { 
      name: 'unread_counts_index',
      background: true 
    });
    console.log('✅ Added unread counts index');
    
    await conversationCollection.createIndex({ updatedAt: -1, status: 1 }, { 
      name: 'updated_status_index',
      background: true 
    });
    console.log('✅ Added conversation updated + status index');
    
    // Test query performance after optimization
    console.log('\n🧪 Testing messaging query performance...');
    
    // Test conversation query
    const convStart = Date.now();
    const conversations = await Conversation.find({
      'participants.user': { $exists: true },
      status: { $ne: 'archived' }
    })
    .populate('participants.user', 'userName email role')
    .populate('lastMessage.sender', 'userName email role')
    .sort({ 'lastMessage.sentAt': -1, updatedAt: -1 })
    .limit(10)
    .lean();
    const convEnd = Date.now();
    
    console.log(`✅ Conversation query completed in: ${convEnd - convStart} ms`);
    console.log(`📈 Found ${conversations.length} conversations`);
    
    // Test message query
    if (conversations.length > 0) {
      const testConversationId = conversations[0]._id;
      
      const msgStart = Date.now();
      const messages = await Message.find({
        conversation: testConversationId,
        deletedAt: { $exists: false }
      })
      .populate('sender', 'userName email role')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
      const msgEnd = Date.now();
      
      console.log(`✅ Message query completed in: ${msgEnd - msgStart} ms`);
      console.log(`📈 Found ${messages.length} messages for conversation`);
    }
    
    // Test unread count query
    const unreadStart = Date.now();
    const totalUnread = await Message.countDocuments({
      'readBy.user': { $ne: conversations[0]?.participants[0]?.user?._id },
      deletedAt: { $exists: false }
    });
    const unreadEnd = Date.now();
    
    console.log(`✅ Unread count query completed in: ${unreadEnd - unreadStart} ms`);
    console.log(`📈 Total unread messages: ${totalUnread}`);
    
    await mongoose.connection.close();
    console.log('\n🎉 Messaging database optimization completed successfully!');
    
  } catch (error) {
    console.error('❌ Messaging database optimization failed:', error);
    process.exit(1);
  }
}

optimizeMessagingDatabase(); 