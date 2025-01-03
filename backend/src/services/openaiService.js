// npm install openai
// npm install dotenv
import OpenAI from 'openai';
import dotenv from 'dotenv';
import fetch from 'node-fetch';


dotenv.config();
/**
 * OpenAI API와 파파고 번역 연동을 처리하기 위한 서비스 클래스.
 * 뉴스 요약, 번역, 이미지 생성을 위한 메서드를 제공합니다.
 * 
 * @class OpenAIService
 * @typedef {Object} ServiceConfig
 * @프로퍼티 {스트링} [openaiApiKey] - OpenAI API 키
 * @프로퍼티 {스트링} [papagoClientId] - 파파고 API 클라이언트 ID
 * @프로퍼티 {스트링} [파파고클라이언트시크릿] - 파파고 API 클라이언트 비밀번호
 */
class OpenAIService {
  constructor(config = {}) {
    this.client = new OpenAI({ 
      apiKey: config.openaiApiKey || process.env.OPENAI_API_KEY 
    });
    this.papagoConfig = {
      clientId: config.papagoClientId || process.env.PAPAGO_CLIENT_ID,
      clientSecret: config.papagoClientSecret || process.env.PAPAGO_CLIENT_SECRET,
      apiUrl: 'https://naveropenapi.apigw.ntruss.com/nmt/v1/translation'
    };
  }

   /**
   * 뉴스 콘텐츠를 1~4개의 주요 한국어 문장으로 요약합니다.
   * 
   * @param {string} 뉴스콘텐츠 - 요약할 뉴스 콘텐츠
   * @Returns {Promise<Object>} 문장 수와 요약 문장 배열을 포함하는 요약 객체
   * @property {number} 문자열Num - 요약 문장의 수
   * @property {string[]} 문자열 - 한국어 요약 문장 배열
   * @throws {Error} API 호출이 실패하거나 응답 형식이 유효하지 않은 경우
   */
   async summarizeNews(newsContent) {
	try {
	  const response = await this.client.chat.completions.create({
		model: "gpt-3.5-turbo",
		messages: [
		  {
			role: "system",
			content: `You are a strict news summarizer that ONLY processes news articles.
  
  Carefully evaluate if the input is a legitimate news article by checking for:
  1. Professional news writing style and structure
  2. Factual reporting of events, developments, or announcements
  3. Proper attribution and sourcing
  4. Focus on current events or recent developments
  5. Objective tone without personal opinions
  
  If the input is NOT a news article (e.g. blog posts, essays, casual conversations, questions, general text, etc.), 
  you MUST respond with:
  {
	"error": "NOT_NEWS_CONTENT",
	"message": "입력된 내용이 뉴스 형식이 아닙니다."
  }
  
  For valid news content ONLY, Summarize the key points of the news clearly and simply, breaking them into 1-4 key sentences and respond in Korean. Use the following JSON format:
  {
	"stringNum": number,  // number of summary sentences
	"strings": string[]   // array of summary sentences in Korean
  }
  
  The response must be in valid JSON format.`
		  },
		  {
			role: "user", 
			content: `### NEWS_ARTICLE ###\n${newsContent}\n### END_NEWS_ARTICLE ###`
		  }
		],
		temperature: 0.7,
		response_format: { type: "json_object" }
	  });
  
	  const result = JSON.parse(response.choices[0].message.content);
	  
	  // Check if the API indicated this wasn't news content
	  if (result.error === "NOT_NEWS_CONTENT") {
		throw new Error(result.message || '입력된 내용이 뉴스 형식이 아닙니다.');
	  }
  
	  // Validate the response format for valid news summaries
	  if (!result.strings || !Array.isArray(result.strings) || 
		  typeof result.stringNum !== 'number' || 
		  result.stringNum !== result.strings.length ||
		  result.stringNum < 1 || result.stringNum > 4) {
		throw new Error('Invalid API response format');
	  }
  
	  return result;
	} catch (error) {
	  throw new Error(`Failed to summarize news: ${error.message}`);
	}
  }
   /**
   * 파파고 API를 사용하여 한국어 텍스트를 영어로 번역하고 OpenAI 폴백을 사용합니다.
   * 파파고로 번역을 먼저 시도하고 파파고에 실패하면 OpenAI로 넘어갑니다.
   * 
   * @param {string} koreanText - 번역할 한국어 텍스트
   * @returns {Promise<string>} 번역된 영어 텍스트
   * @throws {Error} 파파고와 OpenAI 번역 시도가 모두 실패한 경우
   */

  async translateToEnglish(koreanText) {
    try {
      const response = await fetch(this.papagoConfig.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-ncp-apigw-api-key-id': this.papagoConfig.clientId,
          'x-ncp-apigw-api-key': this.papagoConfig.clientSecret
        },
        body: JSON.stringify({
          source: 'ko',
          target: 'en',
          text: koreanText
        })
      });

      if (!response.ok) {
        throw new Error(`Papago API error: ${response.status}`);
      }

      const data = await response.json();
      return data.message.result.translatedText;
      
    } catch (error) {
      console.warn('Papago translation failed:', error.message);
      
      try {
        const response = await this.client.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "Translate the following Korean text into English."
            },
            {
              role: "user",
              content: koreanText
            }
          ],
          temperature: 0.3
        });
        
        return response.choices[0].message.content;
      } catch (fallbackError) {
        throw new Error(`Translation failed: ${error.message}. Fallback also failed: ${fallbackError.message}`);
      }
    }
  }

    /**
   * DALL-E 3을 사용하여 텍스트 설명을 기반으로 이미지를 생성합니다.
   * 생성 전 한글 입력을 영어로 자동 번역합니다.
   * 
   * @param {string} text - 이미지 생성을 위한 텍스트 설명 (한글)
   * @param {string} [style='none'] - 이미지 스타일('사실적' 또는 '없음')
   * @returns {Promise<string>} 생성된 이미지 URL
   * @throws {Error} 이미지 생성 또는 번역 실패 시
   */

  async generateImage(text, style = 'none') {
	try {
	  const englishText = await this.translateToEnglish(text);
	  
	  let promptStyle;
	  if (style === 'realistic') {
		promptStyle = `Create a photorealistic news photograph for: ${englishText}. Style: documentary photography, journalistic, detailed, high-resolution, natural lighting, photorealistic quality.`;
	  } else {
		promptStyle = `Create a news illustration for: ${englishText}. Style: modern, minimalist, professional news media style, high contrast, clean design, suitable for social media. Include relevant icons and visual metaphors.`;
	  }
  
	  const response = await this.client.images.generate({
		model: "dall-e-3",
		prompt: promptStyle,
		n: 1,
		size: "1024x1024",
		style: "vivid"
	  });
  
	  return response.data[0].url;
	} catch (error) {
	  throw new Error(`Failed to generate image: ${error.message}`);
	}
  }
}

export default OpenAIService;