import 'dotenv/config';
import app from './src/app.js';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 서버가 ${PORT} 포트에서 실행 중입니다.`);
    console.log(`http://localhost:${PORT} 에서 서버에 접속할 수 있습니다.`);
});