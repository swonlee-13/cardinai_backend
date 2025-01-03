import OpenAIService from '../services/openaiService.js';

const openAIService = new OpenAIService();

export const summarize = async (req, res) => {
    try {
        const { data } = req.body;
        const result = await openAIService.summarizeNews(data);
        res.json(result);
    } catch (error) {
        res.status(500).json({ 
            status: 'error',
            message: error.message 
        });
    }
};

export const generateImage = async (req, res) => {
    try {
        const { text, style = 'none' } = req.body;
        const imageUrl = await openAIService.generateImage(text, style);
        res.json({ imageUrl });
    } catch (error) {
        res.status(500).json({ 
            status: 'error',
            message: error.message 
        });
    }
};