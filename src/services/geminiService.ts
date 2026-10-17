/**
 * Client service to communicate with backend Gemini API endpoints
 * With built-in educational fallback responses for seamless classroom demo
 */

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  options?: string[];
  audioText?: string;
  lang?: 'vi' | 'en';
}

const FALLBACK_MODELS = [
  'gemini-3-flash-preview',
  'gemini-3-pro-preview',
  'gemini-2.5-flash',
  'gemini-1.5-flash'
];

interface DirectGeminiResponse {
  text: string | null;
  error?: string;
  modelUsed?: string;
}

async function callDirectGemini(
  prompt: string,
  systemInstruction?: string
): Promise<DirectGeminiResponse> {
  const apiKey = localStorage.getItem('gemini_api_key');
  if (!apiKey) return { text: null, error: 'Chưa cấu hình API Key' };
  const chosenModel = localStorage.getItem('gemini_selected_model') || 'gemini-3-flash-preview';
  const modelsToTry = [chosenModel, ...FALLBACK_MODELS.filter(m => m !== chosenModel)];

  let lastError = '';
  for (const model of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const payload: any = {
        contents: [{ parts: [{ text: prompt }] }]
      };
      if (systemInstruction) {
        payload.systemInstruction = { parts: [{ text: systemInstruction }] };
      }
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const json = await res.json();
        const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return { text, modelUsed: model };
      } else {
        const errJson = await res.json().catch(() => ({}));
        const errDetail = errJson.error?.message || errJson.error?.status || `HTTP ${res.status}`;
        lastError = `[${res.status}] ${errDetail}`;
        console.warn(`[AI Engine] Model ${model} gặp lỗi: ${lastError}. Đang tự động chuyển sang model tiếp theo...`);
      }
    } catch (err: any) {
      lastError = err?.message || 'Lỗi kết nối mạng';
      console.warn(`[AI Engine] Model ${model} exception: ${lastError}. Đang thử model tiếp theo...`);
    }
  }
  return { text: null, error: lastError || '429 RESOURCE_EXHAUSTED' };
}

export const geminiService = {
  /**
   * AI Buddy Chat for Grade 3 Students
   */
  async sendBuddyMessage(
    userMessage: string,
    history: { role: 'user' | 'model'; text: string }[] = [],
    subject: string = 'general'
  ): Promise<{ text: string; audioText?: string; isDemo: boolean }> {
    const clientApiKey = localStorage.getItem('gemini_api_key') || undefined;
    const clientModel = localStorage.getItem('gemini_selected_model') || 'gemini-3-flash-preview';

    try {
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(clientApiKey ? { 'x-gemini-api-key': clientApiKey } : {})
        },
        body: JSON.stringify({
          message: userMessage,
          history,
          subject,
          grade: 3,
          teacherName: 'Đỗ Thị Hoà',
          className: '3C1',
          clientApiKey,
          clientModel
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return { text: data.reply, audioText: data.reply, isDemo: false };
      }
    } catch {
      // Backend route unreachable or network offline, proceed to direct client API fallback
    }

    // Try direct Gemini REST API if user configured API key
    if (clientApiKey) {
      const sysInst = `Bạn là "AI Buddy" - Trợ lý học tập thông minh lớp 3C1, Trường TH Hoài Nhơn, đồng hành cùng cô Đỗ Thị Hoà. Hãy giải thích ngắn gọn, khích lệ và an toàn cho học sinh lớp 3. Môn học: ${subject}.`;
      const directResult = await callDirectGemini(userMessage, sysInst);
      if (directResult.text) {
        return { text: directResult.text, audioText: directResult.text, isDemo: false };
      }
    }

    // High quality pedagogical fallback response for demo
    const lower = userMessage.toLowerCase();
    let reply = '';

    if (lower.includes('hello') || lower.includes('hi') || lower.includes('chào')) {
      reply = `Xin chào bạn nhỏ lớp 3C1! 👋 Mình là AI Buddy - Trợ lý học tập thông minh của cô Đỗ Thị Hoà đây! Hôm nay bạn muốn cùng mình học Tiếng Anh, giải Toán vui, đọc Tiếng Việt hay khám phá Tin học nào?`;
    } else if (lower.includes('english') || lower.includes('tiếng anh') || lower.includes('từ vựng')) {
      reply = `Tuyệt vời! Trong chủ đề Family (Gia đình), chúng mình có các từ: Father (bố), Mother (mẹ), Brother (anh/em trai), Sister (chị/em gái). Em có thể đặt một câu: "This is my family" được không nào? 🌟`;
    } else if (lower.includes('toán') || lower.includes('math') || lower.includes('+') || lower.includes('tính')) {
      reply = `Toán học rất thú vị! Bạn nhỏ hãy nhớ quy tắc: Trong biểu thức có phép nhân, chia, cộng, trừ, chúng mình thực hiện Nhân - Chia trước, Cộng - Trừ sau nhé! Em đang gặp bài toán nào cần gợi ý logic không?`;
    } else if (lower.includes('tiếng việt') || lower.includes('so sánh') || lower.includes('nhân hóa')) {
      reply = `Trong Tiếng Việt 3 (Kết nối tri thức), biện pháp so sánh thường có từ "như", "là", "tựa như". Ví dụ: "Mặt trời như quả cầu lửa khổng lồ". Bạn hãy thử tìm hình ảnh so sánh trong câu thơ của mình nhé! 📖`;
    } else if (lower.includes('tin học') || lower.includes('bàn phím') || lower.includes('chuột')) {
      reply = `Khi gõ bàn phím bằng 10 ngón tay, hai ngón trỏ của em luôn đặt lên 2 phím có gờ chuẩn là phím F và phím J ở hàng phím cơ sở nhé! 💻 Em đã nhớ vị trí này chưa?`;
    } else {
      reply = `AI Buddy đã nhận được câu hỏi của bạn nhỏ lớp 3C1: "${userMessage}". Hãy cùng suy nghĩ từng bước nhé! Em có thể thử chia nhỏ câu hỏi hoặc nêu rõ môn học cần cô Hoà và AI Buddy trợ giúp nhé! ⭐`;
    }

    return { text: reply, audioText: reply, isDemo: true };
  },

  /**
   * AI Class Assistant for Teacher Đỗ Thị Hoà
   */
  async generateTeacherTask(
    type:
      | 'lesson_plan'
      | 'lesson_plan_2345'
      | 'announcement'
      | 'positive_rules'
      | 'differentiated_comment'
      | 'tt27_comment'
      | 'quiz_generator'
      | 'quiz_generator_tt27'
      | 'personalized_remediation'
      | 'digital_skills_rubric',
    parameters: Record<string, any>
  ): Promise<{ result: string; isDemo: boolean; error?: string }> {
    const clientApiKey = localStorage.getItem('gemini_api_key') || undefined;
    const clientModel = localStorage.getItem('gemini_selected_model') || 'gemini-3-flash-preview';
    const teacherName = parameters?.teacherName || 'Đỗ Thị Hoà';
    const className = parameters?.className || '3C1';
    const grade = parameters?.grade || 3;
    const school = parameters?.school || 'Trường Tiểu học Hoài Nhơn';

    try {
      const response = await fetch('/api/gemini/assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(clientApiKey ? { 'x-gemini-api-key': clientApiKey } : {})
        },
        body: JSON.stringify({
          taskType: type,
          parameters,
          teacherName,
          className,
          school,
          clientApiKey,
          clientModel
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return { result: data.content, isDemo: false };
      }
    } catch {
      // Backend route unreachable
    }

    if (clientApiKey) {
      let promptText = '';
      if (type === 'announcement') {
        promptText = `Hãy soạn một thông báo/thư ngỏ gửi Quý phụ huynh học sinh lớp ${className} (${school}) về chủ đề: ${parameters?.topic || 'Kế hoạch học tập tuần mới và rèn luyện kỹ năng số'}. Ký tên: Giáo viên chủ nhiệm ${teacherName}.`;
      } else if (type === 'lesson_plan' || type === 'lesson_plan_2345') {
        promptText = `Hãy soạn Kế hoạch bài dạy (giáo án) chuẩn Công văn 2345/BGDĐT-GDTH cho môn ${parameters?.subject || 'Tiếng Việt'}, khối ${grade}, bộ sách ${parameters?.bookSeries || 'Kết nối tri thức'}, bài: "${parameters?.lessonTitle || 'Luyện từ và câu'}". Có tích hợp công nghệ AI, chia 4 hoạt động: Khởi động, Khám phá, Luyện tập, Vận dụng, đánh giá theo Thông tư 27. Giáo viên: ${teacherName}.`;
      } else if (type === 'positive_rules') {
        promptText = `Hãy sáng tác 5-7 câu nội quy lớp học hạnh phúc viết dạng thơ hoặc vè 4-5 chữ vui nhộn, truyền cảm hứng cho học sinh lớp ${className}. Giáo viên: ${teacherName}.`;
      } else if (type === 'differentiated_comment' || type === 'tt27_comment') {
        promptText = `Hãy soạn nhận xét học sinh tiểu học chuẩn Thông tư 27/2020/TT-BGDĐT cho học sinh: ${parameters?.studentData?.fullName || 'học sinh'}, điểm mạnh: ${parameters?.studentData?.skills ? JSON.stringify(parameters.studentData.skills) : 'toán và tiếng anh'}, mục tiêu: ${parameters?.studentData?.supportGoal || 'tiến bộ đều'}. Cần có nhận xét Môn học, Năng lực chung, Phẩm chất, biện pháp hỗ trợ cụ thể mang tính động viên tích cực.`;
      } else if (type === 'quiz_generator' || type === 'quiz_generator_tt27') {
        promptText = `Hãy tạo Đề kiểm tra định kỳ môn ${parameters?.subject || 'Toán'}, khối ${grade}, chủ đề "${parameters?.topic || 'Ôn tập phép nhân và chia'}" kèm Ma trận đề 3 mức độ theo Thông tư 27 (Mức 1: 40%, Mức 2: 30%, Mức 3: 30%), có đáp án và biểu điểm chi tiết.`;
      } else if (type === 'personalized_remediation') {
        promptText = `Hãy lập Kế hoạch phụ đạo và bồi dưỡng cá nhân hóa cho học sinh ${parameters?.studentData?.fullName || 'học sinh'} lớp ${className}, hiện đang cần hỗ trợ: "${parameters?.studentData?.supportGoal || 'Rèn luyện tính toán'}". Nêu rõ hoạt động cho cô giáo, học sinh và gia đình trong 2 tuần tới.`;
      } else if (type === 'digital_skills_rubric') {
        promptText = `Hãy thiết kế bảng Rubric đánh giá Năng lực số và Kỹ năng thế kỷ 21 cho học sinh tiểu học (lớp ${className}) theo 4 mức độ: Tốt, Khá, Đạt, Cần cố gắng, tập trung vào kỹ năng tra cứu an toàn, làm việc nhóm và tương tác với AI học tập.`;
      } else {
        promptText = `Hỗ trợ giáo viên lớp ${className}: ${JSON.stringify(parameters)}`;
      }
      const directResult = await callDirectGemini(promptText);
      if (directResult.text) {
        return { result: directResult.text, isDemo: false };
      }
      if (directResult.error) {
        return { result: '', isDemo: false, error: directResult.error };
      }
    }

    // High standard pedagogical fallback tailored to Vietnamese Primary Education Standards
    let sample = '';
    if (type === 'lesson_plan' || type === 'lesson_plan_2345') {
      const subjectName = parameters?.subject || 'Tiếng Việt 3';
      const lessonTitle = parameters?.lessonTitle || 'Luyện từ và câu - Từ ngữ chỉ tình cảm gia đình. Biện pháp So sánh';
      const bookSeries = parameters?.bookSeries || 'Bộ sách Kết nối tri thức với cuộc sống';

      sample = `📋 KẾ HOẠCH BÀI DẠY (GIÁO ÁN) CHUẨN CÔNG VĂN 2345/BGDĐT-GDTH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TRƯỜNG: ${school} • LỚP: ${className} (KHỐI ${grade})
GIÁO VIÊN THỰC HIỆN: ${teacherName}
MÔN HỌC: ${subjectName} (${bookSeries})
BÀI DẠY: ${lessonTitle}
THỜI LƯỢNG: 1 tiết (35 phút) • TÍCH HỢP: Ứng dụng AI Class & Công nghệ số

I. YÊU CẦU CẦN ĐẠT:
1. Năng lực đặc thù:
   - Nhận biết và mở rộng 8-10 từ ngữ chỉ tình cảm gia đình (yêu thương, quý mến, săn sóc, hiếu thảo...).
   - Xác định đúng 3 thành phần trong câu so sánh: Sự vật 1, Từ so sánh (như, là, tựa), Sự vật 2.
   - Vận dụng đặt được 2-3 câu văn có hình ảnh so sánh sinh động về người thân trong gia đình.
2. Năng lực chung:
   - Tự chủ và tự học: Tự giác tương tác với trợ lý AI Buddy để tra cứu từ vựng và tự kiểm tra bài.
   - Giao tiếp và hợp tác: Tích cực thảo luận cặp đôi và nhóm 4, chia sẻ ý tưởng tự tin.
   - Năng lực giải quyết vấn đề và sáng tạo: Lựa chọn từ ngữ gợi cảm để miêu tả độc đáo.
3. Phẩm chất chủ yếu:
   - Nhân ái: Bồi dưỡng tình yêu thương, kính trọng ông bà cha mẹ và biết ơn người thân.
   - Chăm chỉ: Hoàn thành nhiệm vụ học tập trên lớp và bài tập về nhà.
   - Trách nhiệm: Giữ gìn vở sạch chữ đẹp, có ý thức đóng góp cho nhóm.

II. ĐỒ DÙNG DẠY HỌC VÀ ỨNG DỤNG CÔNG NGHỆ:
- Giáo viên: Tivi/Màn hình tương tác, hệ thống ứng dụng AI CLASS, thẻ từ số hóa, video bài giảng.
- Học sinh: Bảng con, sách giáo khoa, máy tính bảng/thiết bị truy cập góc học tập AI Buddy.

III. CÁC HOẠT ĐỘNG DẠY HỌC CHỦ YẾU (TIẾN TRÌNH 4 BƯỚC):
1. Hoạt động Khởi động (5 phút) - "Vòng xoay kết nối":
   - Giáo viên mở trò chơi Vòng quay may mắn trên AI Class, gọi ngẫu nhiên học sinh hát bài "Cả nhà thương nhau".
   - Giáo viên dẫn dắt: "Gia đình là tổ ấm thiêng liêng. Hôm nay cô cùng các con sẽ tìm những từ ngữ đẹp nhất và học cách so sánh kỳ diệu về tình cảm gia đình nhé!"
2. Hoạt động Khám phá (12 phút) - "Khám phá tri thức cùng AI Buddy":
   - Nhiệm vụ 1: Đọc đoạn ngữ liệu mẫu trên bảng thông minh.
   - Nhiệm vụ 2: Học sinh tương tác cùng AI Buddy tra cứu nhanh nghĩa của từ "chăm bẵm", "hiếu thảo".
   - Giáo viên chốt kiến thức: Cấu trúc câu so sánh gồm vế A, từ so sánh và vế B.
3. Hoạt động Luyện tập, thực hành (13 phút) - "Phân hóa năng lực":
   - Nhóm Cần hỗ trợ: Ghép thẻ từ ngữ vào hình ảnh minh họa tương ứng.
   - Nhóm Hoàn thành: Đặt câu so sánh theo mẫu cho sẵn: "Mẹ hiền như..." / "Công cha tựa như...".
   - Nhóm Năng khiếu: Viết đoạn văn ngắn 3-4 câu kể về một cử chỉ yêu thương của người thân, có sử dụng biện pháp so sánh.
   - Giáo viên quan sát, hỗ trợ kịp thời từng nhóm theo Thông tư 27.
4. Hoạt động Vận dụng, trải nghiệm (5 phút) - "Thông điệp yêu thương":
   - Học sinh gửi 1 câu văn tâm đắc nhất lên Bảng khen thưởng lớp học.
   - Giáo viên tổng kết, tuyên dương học sinh tích cực, trao huy hiệu "Creative Thinker" và "English Star".

IV. ĐIỀU CHỈNH SAU BÀI DẠY:
- Học sinh nắm vững mô hình so sánh, cần chú ý uốn nắn một số em viết hoa đầu câu và chấm cuối câu.`;
    } else if (type === 'differentiated_comment' || type === 'tt27_comment') {
      const studentName = parameters?.studentData?.fullName || 'Nguyễn Bảo An';
      const code = parameters?.studentData?.studentCode || 'HS301';
      const progress = parameters?.studentData?.learningProgress || 92;

      sample = `📝 BẢN NHẬN XÉT HỌC SINH TIỂU HỌC CHUẨN THÔNG TƯ 27/2020/TT-BGDĐT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HỌ VÀ TÊN HỌC SINH: ${studentName} (MÃ HS: ${code})
LỚP: ${className} • TRƯỜNG: ${school}
GIÁO VIÊN CHỦ NHIỆM: ${teacherName} • ĐÁNH GIÁ ĐỊNH KỲ: ĐẠT MỨC HOÀN THÀNH TỐT (T)

1. ĐÁNH GIÁ MÔN HỌC VÀ HOẠT ĐỘNG GIÁO DỤC:
- Môn Tiếng Việt (T): Đọc to, phát âm chuẩn, diễn cảm tốt; vốn từ vựng phong phú, biết vận dụng biện pháp so sánh sáng tạo vào bài viết; chữ viết sạch đẹp, đúng chính tả.
- Môn Toán (T): Tính toán nhanh nhẹn, nắm chắc bảng nhân chia, giải toán có lời văn logic và trình bày bài giải khoa học; tư duy linh hoạt trong các bài tập nâng cao.
- Môn Tiếng Anh (T): Tự tin giao tiếp song ngữ, phát âm chuẩn các chủ đề Family & School; chăm chỉ tương tác cùng AI Buddy luyện phản xạ.
- Môn Tin học & Công nghệ (T): Thao tác gõ 10 ngón tay chuẩn phím F-J, sử dụng thiết bị số an toàn, ham học hỏi và biết tìm kiếm thông tin bài học.

2. ĐÁNH GIÁ SỰ HÌNH THÀNH VÀ PHÁT TRIỂN NĂNG LỰC CHUNG:
- Tự chủ và tự học (T): Tự giác chuẩn bị sách vở đồ dùng, hoàn thành nhiệm vụ đúng tiến độ (Đạt ${progress}% mục tiêu).
- Giao tiếp và hợp tác (T): Lắng nghe bạn bè, trao đổi cởi mở, biết dẫn dắt nhóm nhỏ hoàn thành bài tập chung xuất sắc.
- Giải quyết vấn đề và sáng tạo (T): Thường xuyên có ý tưởng phát biểu mới mẻ, tự tin đề xuất cách giải bài toán hay.

3. ĐÁNH GIÁ SỰ HÌNH THÀNH VÀ PHÁT TRIỂN PHẨM CHẤT:
- Nhân ái & Trách nhiệm (T): Tốt bụng, hòa đồng, luôn sẵn sàng hướng dẫn và giúp đỡ bạn cùng tiến; giữ gìn vệ sinh chung lớp học.
- Chăm chỉ & Trung thực (T): Đi học chuyên cần, trung thực trong kiểm tra đánh giá, tích cực giơ tay xây dựng bài.

4. LỜI KHUYÊN ĐỘNG VIÊN & BIỆN PHÁP PHỐI HỢP VỚI GIA ĐÌNH:
- Cô giáo nhiệt liệt khen ngợi sự nỗ lực vượt bậc của em ${studentName}.
- Đề xuất gia đình: Tiếp tục duy trì thói quen đọc sách 20 phút mỗi tối và khuyến khích con tham gia câu lạc bộ Hùng biện tiếng Anh để phát huy tối đa tố chất lãnh đạo!`;
    } else if (type === 'quiz_generator' || type === 'quiz_generator_tt27') {
      const subjectName = parameters?.subject || 'Toán 3';
      const topic = parameters?.topic || 'Bảng nhân - chia, Tính giá trị biểu thức và Giải toán có lời văn';

      sample = `🎯 ĐỀ KIỂM TRA ĐỊNH KỲ & MA TRẬN ĐỀ 3 MỨC ĐỘ (THÔNG TƯ 27)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MÔN: ${subjectName} - KHỐI ${grade} • THỜI GIAN LÀM BÀI: 35 PHÚT
LỚP: ${className} • TRƯỜNG: ${school} • GV RA ĐỀ: ${teacherName}
CHỦ ĐỀ: ${topic}

A. MA TRẬN ĐỀ KIỂM TRA:
┌─────────────────────────┬──────────────┬──────────────┬──────────────┬──────────────┐
│ Nội dung kiến thức       │ Mức 1 (40%)  │ Mức 2 (30%)  │ Mức 3 (30%)  │ Tổng điểm    │
├─────────────────────────┼──────────────┼──────────────┼──────────────┼──────────────┤
│ 1. Kỹ năng tính nhẩm    │ Câu 1, 2 (2đ)│ Câu 3 (1.5đ) │              │ 3.5 điểm     │
│ 2. Giá trị biểu thức    │ Câu 4 (1đ)   │ Câu 5 (1.5đ) │              │ 2.5 điểm     │
│ 3. Giải toán thực tế    │ Câu 6 (1đ)   │              │ Câu 7, 8 (3đ)│ 4.0 điểm     │
├─────────────────────────┼──────────────┼──────────────┼──────────────┼──────────────┤
│ TỔNG CỘNG               │ 4.0 điểm     │ 3.0 điểm     │ 3.0 điểm     │ 10.0 điểm    │
└─────────────────────────┴──────────────┴──────────────┴──────────────┴──────────────┘

B. NỘI DUNG ĐỀ KIỂM TRA:
PHẦN I: TRẮC NGHIỆM KHÁCH QUAN (6.0 điểm)
Câu 1 (Mức 1 - 1đ): Kết quả của phép tính 7 × 8 là:
  A. 54          B. 56          C. 63          D. 48
Câu 2 (Mức 1 - 1đ): Trong các phép chia sau, phép chia nào có số dư lớn nhất khi chia cho 6?
  A. 25 : 6      B. 29 : 6      C. 31 : 6      D. 19 : 6
Câu 3 (Mức 2 - 1.5đ): Giá trị của biểu thức 120 - 20 × 4 là:
  A. 400         B. 40          C. 60          D. 100
Câu 4 (Mức 1 - 1đ): Một bao gạo nặng 45kg, sau khi bán đi một phần năm số gạo thì còn lại bao nhiêu ki-lô-gam?
  A. 9kg         B. 36kg        C. 40kg        D. 25kg
Câu 5 (Mức 2 - 1.5đ): Điền dấu thích hợp: 8m 4dm ... 804cm
  A. >           B. <           C. =           D. Không so sánh được

PHẦN II: TỰ LUẬN & VẬN DỤNG THỰC TẾ (4.0 điểm)
Câu 6 (Mức 2 - 1.5đ): Đặt tính rồi tính:
  a) 124 × 3                        b) 486 : 2
Câu 7 (Mức 3 - 1.5đ): Lớp ${className} có 32 học sinh. Cô giáo chia các bạn thành các nhóm trải nghiệm AI Buddy, mỗi nhóm có 4 bạn. Hỏi cô giáo chia được tất cả bao nhiêu nhóm học tập?
Câu 8 (Mức 3 - 1.0đ): Đố vui tư duy: Tìm một số, biết rằng lấy số đó nhân với 6 rồi cộng với 18 thì được số nhỏ nhất có ba chữ số khác nhau?

C. ĐÁP ÁN & BIỂU ĐIỂM CHI TIẾT:
- Câu 1: B (56) - 1.0đ
- Câu 2: B (29 : 6 = 4 dư 5) - 1.0đ
- Câu 3: B (20 × 4 = 80; 120 - 80 = 40) - 1.5đ
- Câu 4: B (45 : 5 = 9kg; 45 - 9 = 36kg) - 1.0đ
- Câu 5: > (840cm > 804cm) - 1.5đ
- Câu 6: a) 372 (0.75đ); b) 243 (0.75đ)
- Câu 7: Số nhóm chia được là: 32 : 4 = 8 (nhóm). Đáp số: 8 nhóm. (1.5đ)
- Câu 8: Số nhỏ nhất có 3 chữ số khác nhau là 102. Số cần tìm là: (102 - 18) : 6 = 14. (1.0đ)`;
    } else if (type === 'personalized_remediation') {
      const studentName = parameters?.studentData?.fullName || 'Em Lê Gia Bảo';
      const supportGoal = parameters?.studentData?.supportGoal || 'Rèn luyện khả năng phát âm từ vựng Tiếng Anh và tính toán có lời văn';

      sample = `💡 KẾ HOẠCH BỒI DƯỠNG & PHỤ ĐẠO CÁ NHÂN HÓA (AI REMEDIATION PLAN)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ĐỐI TƯỢNG HỖ TRỢ: ${studentName} (LỚP ${className})
GIÁO VIÊN CHỦ NHIỆM: ${teacherName} • THỜI GIAN THỰC HIỆN: 2 TUẦN TỚI
MỤC TIÊU TRỌNG TÂM: ${supportGoal}

1. CHẨN ĐOÁN NGUYÊN NHÂN & VẤN ĐỀ CẦN THÁO GỠ:
- Học sinh có tinh thần chăm chỉ nhưng còn e dè khi phát âm từ vựng tiếng Anh mới.
- Trong môn Toán, con đọc đề bài toán có lời văn còn vội, dễ nhầm lẫn giữa "gấp lên nhiều lần" và "giảm đi nhiều lần".

2. LỘ TRÌNH HÀNH ĐỘNG 3 BÊN (GIÁO VIÊN - HỌC SINH - PHỤ HUYNH):
a) Đối với Cô giáo chủ nhiệm trên lớp:
   - Xếp con ngồi cùng bạn nhóm trưởng kèm cặp (đôi bạn cùng tiến với bạn đạt huy hiệu English Star).
   - Gọi con phát biểu ở câu hỏi mức độ nhận biết để tạo tâm lý tự tin, khen thưởng kịp thời trước lớp.
   - Dành 10 phút cuối tiết tự học chiều thứ Ba và thứ Năm hướng dẫn con gạch chân từ khóa trong đề toán.
b) Đối với Học sinh khi tự học ở nhà:
   - Dành 15 phút mỗi ngày mở góc AI Buddy, bấm nghe phát âm mẫu và đọc theo 3 lần/từ.
   - Làm 2 bài toán đố vui trên GameHub trước khi đi ngủ.
c) Đối với Phụ huynh học sinh:
   - Động viên, không gây áp lực điểm số cho con.
   - Cùng con đố vui từ vựng tiếng Anh trong các hoạt động thường ngày tại gia đình.

3. TIÊU CHÍ ĐÁNH GIÁ KẾT QUẢ SAU 2 TUẦN:
- Đọc to, rõ ràng và phát âm đúng ít nhất 10 từ vựng chủ đề hiện tại.
- Tự giải đúng bài toán có lời văn dạng 1 bước và 2 bước tính mà không cần người lớn nhắc nhở.
- Trao huy hiệu khen thưởng "Daily Learner" và "Kind Friend" khi đạt mục tiêu!`;
    } else if (type === 'digital_skills_rubric') {
      sample = `📊 KHUNG RUBRIC ĐÁNH GIÁ NĂNG LỰC SỐ & KỸ NĂNG THẾ KỶ 21 CHO HỌC SINH TIỂU HỌC
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ÁP DỤNG: LỚP ${className} • TRƯỜNG: ${school} • GVCN: ${teacherName}

┌────────────────────────┬──────────────────────┬──────────────────────┬──────────────────────┐
│ Tiêu chí Năng lực       │ Mức Tốt (Level 3)    │ Mức Đạt (Level 2)    │ Cần Cố Gắng (Level 1)│
├────────────────────────┼──────────────────────┼──────────────────────┼──────────────────────┤
│ 1. Thao tác thiết bị   │ Sử dụng chuột & gõ   │ Thao tác cơ bản đúng │ Còn lúng túng khi gõ │
│    và phần mềm học tập │ bàn phím 10 ngón     │ vị trí, cần ít sự    │ phím, cần hỗ trợ mở  │
│                        │ chuẩn, mở app nhanh  │ hỗ trợ từ cô giáo    │ ứng dụng học tập     │
├────────────────────────┼──────────────────────┼──────────────────────┼──────────────────────┤
│ 2. Tương tác an toàn   │ Đặt câu hỏi thông    │ Tương tác lịch sự,   │ Chưa biết cách hỏi rõ│
│    cùng AI Buddy       │ minh, biết nhờ AI    │ hỏi đúng môn học,    │ ràng, cần hướng dẫn  │
│                        │ giải thích dễ hiểu   │ lắng nghe gợi ý      │ thêm cách tra cứu    │
├────────────────────────┼──────────────────────┼──────────────────────┼──────────────────────┤
│ 3. Văn hóa số &        │ Bảo mật mật khẩu,    │ Biết giữ bí mật TK,  │ Còn để lộ mật khẩu,  │
│    An toàn trên mạng   │ không xem nội dung lạ│ không bấm link lạ,   │ dùng máy tính quá    │
│                        │ ngồi học đúng tư thế │ ngồi học ngay ngắn   │ thời gian quy định   │
├────────────────────────┼──────────────────────┼──────────────────────┼──────────────────────┤
│ 4. Hợp tác & Chia sẻ   │ Tích cực chia sẻ máy │ Phối hợp tốt với bạn,│ Chưa biết nhường     │
│    trong nhóm          │ tính bảng, hỗ trợ bạn│ biết lắng nghe ý kiến│ thiết bị cho bạn,    │
│                        │ cùng tiến bộ         │ đóng góp của nhóm    │ dễ mất tập trung     │
└────────────────────────┴──────────────────────┴──────────────────────┴──────────────────────┘`;
    } else if (type === 'announcement') {
      sample = `📢 THÔNG BÁO TỪ GIÁO VIÊN CHỦ NHIỆM LỚP ${className} (${teacherName})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Kính gửi Quý phụ huynh học sinh lớp ${className},

Để chuẩn bị tốt nhất cho tuần học mới theo định hướng phát triển năng lực và ứng dụng công nghệ số hiệu quả, cô giáo xin gửi đến Quý phụ huynh một số nội dung phối hợp trọng tâm như sau:

1. Học tập & Rèn luyện:
   - Nhắc các con hoàn thành thử thách song ngữ và bài tập Toán rèn luyện tư duy trên ứng dụng AI CLASS.
   - Khuyến khích con dành 15 phút mỗi ngày tương tác cùng trợ lý AI Buddy để mở rộng vốn hiểu biết và rèn kỹ năng tự học.
2. Nề nếp & Kỹ năng sống:
   - Giáo dục con kỹ năng tự giác soạn sách vở đúng thời khóa biểu, giữ gìn vệ sinh và an toàn khi sử dụng thiết bị số.
   - Lớp ${className} đã vinh danh trao 22 huy hiệu "English Star", "Kind Friend" và "Daily Learner" cho các con nỗ lực trong tuần qua!

Trân trọng cảm ơn sự đồng hành quý báu của Quý phụ huynh vì sự tiến bộ và niềm vui mỗi ngày đến trường của các con!
Cô giáo chủ nhiệm: ${teacherName} - Lớp ${className}`;
    } else if (type === 'positive_rules') {
      sample = `🌟 NỘI QUY LỚP HỌC HẠNH PHÚC ${className} - ${school}
(Giáo viên chủ nhiệm: ${teacherName})

Đến trường rạng rỡ nụ cười,
Lắng nghe cô giảng, điểm mười chăm ngoan.
Bạn bè đoàn kết hân hoan,
Giúp nhau cùng tiến, vẹn toàn chữ tâm.
Bàn phím gõ chuẩn phím F,
Màn hình sáng đẹp, góc ngồi chỉn chu.
Nói lời hay, làm việc tốt,
Lớp học hạnh phúc, tự tin vươn xa! 🌟`;
    } else {
      sample = `Nội dung đã được trợ lý AI lớp ${className} xử lý thành công theo chuẩn chương trình GDPT 2018 của ${teacherName}.`;
    }

    return { result: sample, isDemo: true };
  },

  /**
   * Smart Game Generator Engine: parse raw questions from file content or text
   */
  async parseGameFromContent(
    content: string,
    answerKeyText?: string
  ): Promise<{
    suggestedGameType: string;
    questions: any[];
    isDemo: boolean;
  }> {
    const clientApiKey = localStorage.getItem('gemini_api_key') || undefined;
    const clientModel = localStorage.getItem('gemini_selected_model') || 'gemini-3-flash-preview';

    try {
      const response = await fetch('/api/gemini/parse-game', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(clientApiKey ? { 'x-gemini-api-key': clientApiKey } : {})
        },
        body: JSON.stringify({ content, answerKeyText, clientApiKey, clientModel }),
      });

      if (response.ok) {
        return await response.json();
      }
    } catch {
      // Fallback
    }

    // Auto-parse mock based on input
    const questions = [
      {
        id: 'gen-1',
        prompt: 'Trong phép chia 36 : 4, kết quả bằng bao nhiêu?',
        options: ['7', '8', '9', '6'],
        answer: '9',
        hint: 'Hãy nhớ lại bảng chia 4 (4 x 9 = 36).'
      },
      {
        id: 'gen-2',
        prompt: 'Từ nào sau đây là từ chỉ hoạt động của học sinh?',
        options: ['Chăm chỉ', 'Học bài', 'Quyển vở', 'Xinh xắn'],
        answer: 'Học bài',
        hint: 'Học bài là việc em làm mỗi ngày.'
      },
      {
        id: 'gen-3',
        prompt: 'Chọn từ tiếng Anh có nghĩa là "trường học":',
        options: ['Teacher', 'Student', 'School', 'Book'],
        answer: 'School',
        hint: 'Nơi chúng mình gặp thầy cô và bạn bè.'
      }
    ];

    return {
      suggestedGameType: 'magic-quiz',
      questions,
      isDemo: true
    };
  }
};
