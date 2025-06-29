import { Story } from '@/store/slices/storySlice';

// Mock API service - replace with your actual API endpoints
export const storyService = {
  async generateStory(systemPrompt: string, userPrompt: string): Promise<Story> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock response - replace with actual API call
    const mockStory: Story = {
      id: Date.now().toString(),
      title: `The Adventures of ${userPrompt.split(' ')[0] || 'Little Hero'}`,
      description: `A magical story about ${userPrompt.toLowerCase()}. Join our hero on an incredible journey filled with wonder and excitement!`,
      content: `Once upon a time, ${userPrompt}. This is where the magical story would continue with AI-generated content based on your system prompt: "${systemPrompt}". The story would be engaging, educational, and perfectly tailored for children.`,
      generatedTime: new Date().toISOString(),
      systemPrompt,
    };
    
    return mockStory;
  },
};