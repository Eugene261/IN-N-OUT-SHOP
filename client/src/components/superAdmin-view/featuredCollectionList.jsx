import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Edit, Trash2, MoveUp, MoveDown, Eye, EyeOff } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

function FeaturedCollectionList({ collections, isLoading, onEdit, onDelete, onPositionUpdate }) {
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    const items = Array.from(collections);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    // Update positions based on new order
    const updatedPositions = items.map((item, index) => ({
      id: item._id,
      position: index
    }));
    
    onPositionUpdate(updatedPositions);
  };
  
  const moveItem = (index, direction) => {
    if (
      (direction === 'up' && index === 0) || 
      (direction === 'down' && index === collections.length - 1)
    ) {
      return; // Can't move further
    }
    
    const items = Array.from(collections);
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    const [movedItem] = items.splice(index, 1);
    items.splice(newIndex, 0, movedItem);
    
    // Update positions based on new order
    const updatedPositions = items.map((item, index) => ({
      id: item._id,
      position: index
    }));
    
    onPositionUpdate(updatedPositions);
  };
  
  if (isLoading) {
    return (
      <Card className="border shadow-sm">
        <CardContent className="p-6">
          <div className="flex justify-center items-center h-40">
            <div className="animate-pulse text-gray-400">Loading collections...</div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!collections || collections.length === 0) {
    return (
      <Card className="border shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col justify-center items-center h-40 text-center">
            <p className="text-gray-500 mb-2">No featured collections found</p>
            <p className="text-sm text-gray-400">
              Add your first collection to display on the shop homepage
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="border shadow-sm">
      <CardContent className="p-0">
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="collections">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="divide-y"
              >
                {collections.map((collection, index) => (
                  <Draggable 
                    key={collection._id} 
                    draggableId={collection._id} 
                    index={index}
                  >
                    {(provided) => (
                      <motion.div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className="p-4 hover:bg-gray-50 transition-colors"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-md overflow-hidden flex-shrink-0 border border-gray-200">
                            {collection.image ? (
                              <img 
                                src={collection.image} 
                                alt={collection.title} 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                                No Image
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium text-gray-900 truncate">
                                {collection.title}
                              </h3>
                              {collection.isActive ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                  <Eye className="w-3 h-3 mr-1" />
                                  Active
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                  <EyeOff className="w-3 h-3 mr-1" />
                                  Hidden
                                </span>
                              )}
                            </div>
                            
                            {collection.description && (
                              <p className="text-sm text-gray-500 mt-1 truncate">
                                {collection.description}
                              </p>
                            )}
                            
                            <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                              <span>Position: {collection.position}</span>
                              <span>•</span>
                              <span>Link: {collection.linkTo}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => moveItem(index, 'up')}
                              disabled={index === 0}
                              title="Move up"
                            >
                              <MoveUp className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => moveItem(index, 'down')}
                              disabled={index === collections.length - 1}
                              title="Move down"
                            >
                              <MoveDown className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onEdit(collection)}
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onDelete(collection._id)}
                              className="text-red-500 hover:text-red-600 hover:bg-red-50"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </CardContent>
    </Card>
  );
}

export default FeaturedCollectionList;
