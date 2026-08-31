import fs from 'fs';

// Curated comprehensive vocabulary components
const VOCABULARY_CORPUS = [
  // 1. Foundation & Everyday Communication (A1 - A2)
  { w: "ability", p: "/əˈbɪl.ə.ti/", t: "Danh từ", m: "Khả năng, năng lực", c: "B1 - Trung cấp", top: "Đời sống", ex: "She has the ability to solve complex mathematical problems quickly.", exd: "Cô ấy có khả năng giải quyết các bài toán phức tạp một cách nhanh chóng." },
  { w: "abroad", p: "/əˈbrɔːd/", t: "Trạng từ", m: "Ở nước ngoài, ra nước ngoài", c: "A2 - Sơ cấp", top: "Du lịch & Khách sạn", ex: "He decided to study abroad to experience different cultures.", exd: "Anh ấy quyết định đi du học để trải nghiệm các nền văn hóa khác nhau." },
  { w: "absolute", p: "/ˈæb.sə.luːt/", t: "Tính từ", m: "Tuyệt đối, hoàn toàn", c: "B1 - Trung cấp", top: "Giao tiếp hàng ngày", ex: "We need absolute certainty before making any final decisions.", exd: "Chúng ta cần sự chắc chắn tuyệt đối trước khi đưa ra bất kỳ quyết định cuối cùng nào." },
  { w: "absorb", p: "/əbˈzɔːb/", t: "Động từ", m: "Hấp thụ, tiếp thu", c: "B2 - Trung cao", top: "Khoa học & Đổi mới", ex: "Plants absorb sunlight and convert it into chemical energy through photosynthesis.", exd: "Thực vật hấp thụ ánh sáng mặt trời và chuyển hóa thành năng lượng hóa học qua quang hợp." },
  { w: "abstract", p: "/ˈæb.strækt/", t: "Tính từ", m: "Trừu tượng, bản tóm tắt", c: "B2 - Trung cao", top: "Học thuật & Nghiên cứu", ex: "The concept of infinity is too abstract for young children to grasp easily.", exd: "Khái niệm về vô cực quá trừu tượng để trẻ nhỏ có thể nắm bắt dễ dàng." },
  { w: "abundant", p: "/əˈbʌn.dənt/", t: "Tính từ", m: "Dồi dào, phong phú", c: "B2 - Trung cao", top: "Môi trường & Sinh thái", ex: "The tropical rainforest is abundant with diverse plant and animal species.", exd: "Rừng mưa nhiệt đới rất dồi dào các loài động thực vật đa dạng." },
  { w: "academic", p: "/ˌæk.əˈdem.ɪk/", t: "Tính từ", m: "Thuộc học thuật, viện hàn lâm", c: "B1 - Trung cấp", top: "Giáo dục & Trường học", ex: "She achieved remarkable academic excellence during her university years.", exd: "Cô ấy đã đạt được thành tích học thuật xuất sắc đáng ghi nhận trong những năm đại học." },
  { w: "accelerate", p: "/əkˈsel.ə.reɪt/", t: "Động từ", m: "Thúc đẩy, tăng tốc", c: "B2 - Trung cao", top: "Kinh doanh & Quản trị", ex: "Technological innovation will accelerate the digital transformation process.", exd: "Sự đổi mới công nghệ sẽ thúc đẩy nhanh quá trình chuyển đổi số." },
  { w: "accept", p: "/əkˈsept/", t: "Động từ", m: "Chấp nhận, đón nhận", c: "A1 - Cơ bản", top: "Giao tiếp hàng ngày", ex: "They happily accepted our invitation to the welcome banquet.", exd: "Họ đã vui vẻ chấp nhận lời mời của chúng tôi đến buổi tiệc chào mừng." },
  { w: "access", p: "/ˈæk.ses/", t: "Danh từ", m: "Quyền truy cập, lối vào", c: "A2 - Sơ cấp", top: "Công nghệ & Kỹ thuật số", ex: "All authorized employees have remote access to the internal company server.", exd: "Tất cả nhân viên được ủy quyền đều có quyền truy cập từ xa vào máy chủ nội bộ của công ty." },
  { w: "accommodate", p: "/əˈkɒm.ə.deɪt/", t: "Động từ", m: "Cung cấp chỗ ở, đáp ứng", c: "B2 - Trung cao", top: "Du lịch & Khách sạn", ex: "The new auditorium can accommodate up to five hundred attendees comfortably.", exd: "Hội trường mới có thể đáp ứng chỗ ngồi thoải mái cho tối đa năm trăm người tham dự." },
  { w: "accompany", p: "/əˈkʌm.pə.ni/", t: "Động từ", m: "Đi cùng, đồng hành", c: "B1 - Trung cấp", top: "Đời sống & Gia đình", ex: "Children must be accompanied by an adult when visiting the exhibition hall.", exd: "Trẻ em phải có người lớn đi cùng khi tham quan phòng triển lãm." },
  { w: "accomplish", p: "/əˈkʌm.plɪʃ/", t: "Động từ", m: "Hoàn thành, đạt được", c: "B1 - Trung cấp", top: "Kinh doanh & Quản trị", ex: "Together we can accomplish our quarterly revenue targets ahead of deadline.", exd: "Cùng nhau chúng ta có thể hoàn thành các mục tiêu doanh thu quý trước thời hạn." },
  { w: "accumulate", p: "/əˈkjuː.mjə.leɪt/", t: "Động từ", m: "Tích lũy, gom góp", c: "B2 - Trung cao", top: "Tài chính & Đầu tư", ex: "Over decades of disciplined investing, he accumulated significant financial assets.", exd: "Qua nhiều thập kỷ đầu tư có kỷ luật, ông ấy đã tích lũy được khối tài sản tài chính đáng kể." },
  { w: "accurate", p: "/ˈæk.jə.rət/", t: "Tính từ", m: "Chính xác, chuẩn xác", c: "B1 - Trung cấp", top: "Khoa học & Đổi mới", ex: "Weather forecasting models require accurate satellite observations to produce reliable outcomes.", exd: "Các mô hình dự báo thời tiết đòi hỏi quan sát vệ tinh chuẩn xác để tạo ra kết quả đáng tin cậy." },
  { w: "achieve", p: "/əˈtʃiːv/", t: "Động từ", m: "Đạt được, giành được", c: "A2 - Sơ cấp", top: "Giáo dục & Trường học", ex: "He worked tirelessly to achieve his lifelong aspiration of becoming a surgeon.", exd: "Anh ấy đã làm việc không mệt mỏi để đạt được khát vọng cả đời là trở thành một bác sĩ phẫu thuật." },
  { w: "acquire", p: "/əˈkwaɪər/", t: "Động từ", m: "Thu nhận, mua lại, tiếp thu", c: "B2 - Trung cao", top: "Học thuật & Nghiên cứu", ex: "Immersive practice enables young learners to acquire foreign languages naturally.", exd: "Việc luyện tập đắm chìm giúp người học trẻ tiếp thu ngoại ngữ một cách tự nhiên." },
  { w: "adapt", p: "/əˈdæpt/", t: "Động từ", m: "Thích nghi, phỏng theo", c: "B2 - Trung cao", top: "Môi trường & Sinh thái", ex: "Living organisms continuously adapt to shifting environmental conditions.", exd: "Các sinh vật sống liên tục thích nghi với các điều kiện môi trường luôn biến đổi." },
  { w: "adequate", p: "/ˈæd.ə.kwət/", t: "Tính từ", m: "Đầy đủ, thỏa đáng", c: "B1 - Trung cấp", top: "Sức khỏe & Y tế", ex: "Ensure that patient recovery rooms maintain adequate ventilation and natural light.", exd: "Hãy đảm bảo rằng các phòng hồi sức bệnh nhân duy trì sự thông gió đầy đủ và ánh sáng tự nhiên." },
  { w: "adjacent", p: "/əˈdʒeɪ.sənt/", t: "Tính từ", m: "Kế bên, liền kề", c: "B2 - Trung cao", top: "Vận tải & Hậu cần", ex: "The logistics warehouse is strategically located adjacent to the international cargo port.", exd: "Nhà kho hậu cần nằm ở vị trí chiến lược ngay liền kề cảng hàng hóa quốc tế." },
  { w: "administration", p: "/ədˌmɪn.ɪˈstreɪ.ʃən/", t: "Danh từ", m: "Sự quản trị, ban điều hành", c: "B2 - Trung cao", top: "Kinh doanh & Quản trị", ex: "Efficient hospital administration improves patient satisfaction significantly.", exd: "Công tác quản trị bệnh viện hiệu quả giúp nâng cao đáng kể sự hài lòng của bệnh nhân." },
  { w: "adolescent", p: "/ˌæd.əˈles.ənt/", t: "Danh từ", m: "Thanh thiếu niên", c: "B2 - Trung cao", top: "Tâm lý & Hành vi xã hội", ex: "Adolescents undergo profound emotional and neurological developmental shifts.", exd: "Thanh thiếu niên trải qua những chuyển biến sâu sắc về mặt cảm xúc và sự phát triển thần kinh." },
  { w: "adopt", p: "/əˈdɒpt/", t: "Động từ", m: "Áp dụng, nhận nuôi", c: "B1 - Trung cấp", top: "Kinh doanh & Quản trị", ex: "Enterprises that adopt artificial intelligence gain a formidable competitive advantage.", exd: "Các doanh nghiệp áp dụng trí tuệ nhân tạo sẽ đạt được lợi thế cạnh tranh vượt trội." },
  { w: "advantage", p: "/ədˈvɑːn.tɪdʒ/", t: "Danh từ", m: "Lợi thế, ưu điểm", c: "A2 - Sơ cấp", top: "Kinh doanh & Quản trị", ex: "Early market entry gave our startup a dominant commercial advantage.", exd: "Việc gia nhập thị trường sớm đã mang lại cho công ty khởi nghiệp của chúng tôi lợi thế thương mại áp đảo." },
  { w: "advocate", p: "/ˈæd.və.keɪt/", t: "Động từ", m: "Ủng hộ, tán thành", c: "C1 - Cao cấp", top: "Luật pháp & Ngoại giao", ex: "Environmental researchers advocate for stricter carbon taxation policies globally.", exd: "Các nhà nghiên cứu môi trường ủng hộ mạnh mẽ các chính sách đánh thuế carbon nghiêm ngặt hơn trên toàn cầu." },
  { w: "aesthetic", p: "/esˈθet.ɪk/", t: "Tính từ", m: "Thuộc thẩm mỹ", c: "C1 - Cao cấp", top: "Nghệ thuật & Văn hóa", ex: "The new architecture seamlessly merges structural functionality with aesthetic refinement.", exd: "Công trình kiến trúc mới kết hợp liền mạch giữa công năng kết cấu và sự tinh tế về mặt thẩm mỹ." },
  { w: "affection", p: "/əˈfek.ʃən/", t: "Danh từ", m: "Tình cảm, sự yêu mến", c: "B2 - Trung cao", top: "Đời sống & Gia đình", ex: "He expressed genuine affection towards his lifelong childhood companions.", exd: "Anh ấy bày tỏ tình cảm chân thành đối với những người bạn đồng hành từ thuở thiếu thời." },
  { w: "aggregate", p: "/ˈæɡ.rɪ.ɡət/", t: "Danh từ", m: "Tổng số, tổng hợp", c: "C1 - Cao cấp", top: "Kinh tế & Tài chính", ex: "Aggregate consumer demand showed resilience despite macroeconomic inflation pressures.", exd: "Tổng cầu tiêu dùng cho thấy sự kiên cường bất chấp những áp lực lạm phát kinh tế vĩ mô." },
  { w: "allocate", p: "/ˈæl.ə.keɪt/", t: "Động từ", m: "Phân bổ, chỉ định", c: "B2 - Trung cao", top: "Kinh doanh & Quản trị", ex: "The board voted to allocate 15% of annual revenue to renewable research and development.", exd: "Hội đồng quản trị đã biểu quyết phân bổ 15% doanh thu hàng năm cho nghiên cứu và phát triển năng lượng tái tạo." },
  { w: "alteration", p: "/ˌɒl.təˈreɪ.ʃən/", t: "Danh từ", m: "Sự thay đổi, biến đổi", c: "B2 - Trung cao", top: "Học thuật & Nghiên cứu", ex: "Minor alterations in DNA sequence can lead to significant physiological variations.", exd: "Những biến đổi nhỏ trong trình tự DNA có thể dẫn tới những biến dị sinh lý đáng kể." },
  { w: "ambiguity", p: "/ˌæm.bɪˈɡjuː.ə.ti/", t: "Danh từ", m: "Sự mơ hồ, nước đôi", c: "C1 - Cao cấp", top: "Triết học & Tư duy phản biện", ex: "Legal agreements must eliminate ambiguity to prevent costly disputes later.", exd: "Các thỏa thuận pháp lý phải loại bỏ sự mơ hồ để ngăn ngừa những tranh chấp tốn kém sau này." },
  { w: "ambitious", p: "/æmˈbɪʃ.əs/", t: "Tính từ", m: "Đầy tham vọng, hoài bão", c: "B1 - Trung cấp", top: "Giáo dục & Trường học", ex: "She formulated an ambitious multi-year roadmap to transform healthcare delivery.", exd: "Cô ấy đã xây dựng một lộ trình nhiều năm đầy hoài bão nhằm chuyển đổi chất lượng y tế." },
  { w: "amend", p: "/əˈmend/", t: "Động từ", m: "Sửa đổi, bổ sung", c: "C1 - Cao cấp", top: "Luật pháp & Ngoại giao", ex: "Parliament convened to amend the maritime trade regulations.", exd: "Nghị viện đã triệu tập cuộc họp để sửa đổi các quy định thương mại hàng hải." },
  { w: "analogy", p: "/əˈnæl.ə.dʒi/", t: "Danh từ", m: "Sự tương tự, phép so sánh", c: "C1 - Cao cấp", top: "Triết học & Tư duy phản biện", ex: "The professor drew a vivid analogy between the human brain and a distributed computing cluster.", exd: "Giáo sư đã đưa ra một phép so sánh sinh động giữa não người và một cụm máy tính phân tán." },
  { w: "analyze", p: "/ˈæn.əl.aɪz/", t: "Động từ", m: "Phân tích kỹ lưỡng", c: "B1 - Trung cấp", top: "Học thuật & Nghiên cứu", ex: "Data scientists analyze user telemetry to detect potential platform bottlenecks.", exd: "Các nhà khoa học dữ liệu phân tích dữ liệu viễn trắc người dùng để phát hiện các điểm nghẽn tiềm ẩn trên nền tảng." },
  { w: "anniversary", p: "/ˌæn.ɪˈvɜː.sər.i/", t: "Danh từ", m: "Ngày kỷ niệm", c: "A2 - Sơ cấp", top: "Đời sống & Gia đình", ex: "The firm hosted a prestigious gala celebrating its fiftieth anniversary.", exd: "Công ty đã tổ chức một dạ tiệc danh giá kỷ niệm năm mươi năm thành lập." },
  { w: "anticipate", p: "/ænˈtɪs.ɪ.peɪt/", t: "Động từ", m: "Dự đoán, lường trước", c: "B2 - Trung cao", top: "Kinh doanh & Quản trị", ex: "Forward-thinking leaders anticipate emerging market shifts well before competitors.", exd: "Những nhà lãnh đạo có tầm nhìn xa luôn lường trước các chuyển dịch thị trường mới nổi từ rất sớm trước đối thủ." },
  { w: "apparatus", p: "/ˌæp.əˈreɪ.təs/", t: "Danh từ", m: "Bộ máy, thiết bị chuyên dụng", c: "C1 - Cao cấp", top: "Khoa học & Đổi mới", ex: "The laboratory is outfitted with advanced filtration apparatus for chemical synthesis.", exd: "Phòng thí nghiệm được trang bị bộ máy lọc tân tiến phục vụ quá trình tổng hợp hóa chất." },
  { w: "apparent", p: "/əˈpær.ənt/", t: "Tính từ", m: "Rõ ràng, hiển nhiên", c: "B2 - Trung cao", top: "Giao tiếp hàng ngày", ex: "It became apparent that the initial hypothesis required substantial empirical revision.", exd: "Điều trở nên rõ ràng là giả thuyết ban đầu cần phải được sửa đổi thực nghiệm đáng kể." },
  { w: "appetite", p: "/ˈæp.ə.taɪt/", t: "Danh từ", m: "Sự ngon miệng, khẩu vị rủi ro", c: "B1 - Trung cấp", top: "Ăn uống & Ẩm thực", ex: "A brisk mountain hike always stimulates a healthy appetite for hearty meals.", exd: "Một chuyến đi bộ leo núi sảng khoái luôn kích thích sự ngon miệng cho những bữa ăn no nê." },
  { w: "applicant", p: "/ˈæp.lɪ.kənt/", t: "Danh từ", m: "Người nộp đơn ứng tuyển", c: "TOEIC 500-750", top: "Nhân sự & Tuyển dụng", ex: "Over three hundred qualified applicants submitted resumes for the engineering internship.", exd: "Hơn ba trăm ứng viên đủ tiêu chuẩn đã gửi hồ sơ ứng tuyển vào vị trí thực tập sinh kỹ thuật." },
  { w: "appreciate", p: "/əˈpriː.ʃi.eɪt/", t: "Động từ", m: "Đánh giá cao, cảm kích", c: "B1 - Trung cấp", top: "Giao tiếp hàng ngày", ex: "We deeply appreciate the tremendous dedication demonstrated by our support team.", exd: "Chúng tôi vô cùng cảm kích trước sự cống hiến to lớn mà đội ngũ hỗ trợ đã thể hiện." },
  { w: "apprehensive", p: "/ˌæp.rɪˈhen.sɪv/", t: "Tính từ", m: "Lo âu, e ngại", c: "C1 - Cao cấp", top: "Tâm lý & Hành vi xã hội", ex: "Investors grew apprehensive regarding the fiscal impact of cross-border tariff hikes.", exd: "Các nhà đầu tư trở nên lo âu về tác động tài chính của việc tăng thuế quan xuyên biên giới." },
  { w: "approach", p: "/əˈprəʊtʃ/", t: "Danh từ", m: "Cách tiếp cận, phương pháp", c: "B1 - Trung cấp", top: "Học thuật & Nghiên cứu", ex: "We adopt a multidisciplinary approach combining neuroscience with machine learning.", exd: "Chúng tôi áp dụng một phương pháp tiếp cận đa ngành kết hợp khoa học thần kinh với học máy." },
  { w: "appropriate", p: "/əˈprəʊ.pri.ət/", t: "Tính từ", m: "Thích hợp, phù hợp", c: "B1 - Trung cấp", top: "Giao tiếp hàng ngày", ex: "Please ensure your attire is appropriate for a formal corporate presentation.", exd: "Xin hãy đảm bảo trang phục của bạn phù hợp cho một buổi thuyết trình doanh nghiệp trang trọng." },
  { w: "arbitrary", p: "/ˈɑː.bɪ.trər.i/", t: "Tính từ", m: "Tùy tiện, độc đoán", c: "C1 - Cao cấp", top: "Triết học & Tư duy phản biện", ex: "The committee rejected arbitrary budget allocations lacking quantitative justification.", exd: "Ủy ban đã bác bỏ những khoản phân bổ ngân sách tùy tiện thiếu cơ sở định lượng." },
  { w: "architecture", p: "/ˈɑː.kɪ.tek.tʃər/", t: "Danh từ", m: "Kiến trúc, cấu trúc hệ thống", c: "B2 - Trung cao", top: "Công nghệ & Kỹ thuật số", ex: "Microservices architecture allows software components to scale independently and reliably.", exd: "Kiến trúc vi dịch vụ cho phép các thành phần phần mềm mở rộng một cách độc lập và đáng tin cậy." },
  { w: "artificial", p: "/ˌɑː.tɪˈfɪʃ.əl/", t: "Tính từ", m: "Nhân tạo", c: "A2 - Sơ cấp", top: "Công nghệ & Kỹ thuật số", ex: "Artificial intelligence empowers automated medical image diagnosis at high accuracy.", exd: "Trí tuệ nhân tạo hỗ trợ việc chẩn đoán hình ảnh y khoa tự động với độ chính xác cao." },
  { w: "articulate", p: "/ɑːˈtɪk.jə.lət/", t: "Tính từ", m: "Lưu loát, hoạt ngôn", c: "C1 - Cao cấp", top: "Giao tiếp hàng ngày", ex: "An articulate communicator can explain intricate concepts in crystal-clear terms.", exd: "Một người giao tiếp hoạt ngôn có thể giải thích những khái niệm phức tạp bằng những từ ngữ vô cùng sáng tỏ." },
  { w: "aspiration", p: "/ˌæs.pɪˈreɪ.ʃən/", t: "Danh từ", m: "Khát vọng, hoài bão lớn", c: "B2 - Trung cao", top: "Giáo dục & Trường học", ex: "Her ultimate aspiration is establishing a foundation that funds rural educational initiatives.", exd: "Hoài bão lớn nhất của cô là thành lập một quỹ tài trợ cho các sáng kiến giáo dục vùng nông thôn." },
  { w: "assembly", p: "/əˈsem.bli/", t: "Danh từ", m: "Hội đồng, sự lắp ráp", c: "TOEIC 500-750", top: "Vận tải & Hậu cần", ex: "Robotic arms automate high-precision assembly on the automotive factory line.", exd: "Cánh tay robot tự động hóa việc lắp ráp có độ chính xác cao trên dây chuyền nhà máy ô tô." },
  { w: "assert", p: "/əˈsɜːt/", t: "Động từ", m: "Khẳng định, quả quyết", c: "B2 - Trung cao", top: "Luật pháp & Ngoại giao", ex: "The defense attorneys asserted their client's total innocence before the supreme court.", exd: "Các luật sư bào chữa đã quả quyết sự vô tội hoàn toàn của thân chủ trước tòa án tối cao." },
  { w: "assess", p: "/əˈses/", t: "Động từ", m: "Đánh giá, định giá", c: "B2 - Trung cao", top: "Học thuật & Nghiên cứu", ex: "Peer reviewers assess research submissions for scientific rigour and originality.", exd: "Các nhà bình duyệt đồng cấp đánh giá các bài nộp nghiên cứu về tính chặt chẽ khoa học và tính độc bản." },
  { w: "asset", p: "/ˈæs.et/", t: "Danh từ", m: "Tài sản, vốn quý", c: "TOEIC 500-750", top: "Tài chính & Đầu tư", ex: "Human capital is the most invaluable asset within knowledge-driven industries.", exd: "Nguồn vốn con người là tài sản vô giá nhất trong các ngành công nghiệp dựa trên tri thức." },
  { w: "astonish", p: "/əˈstɒn.ɪʃ/", t: "Động từ", m: "Làm kinh ngạc, sửng sốt", c: "B2 - Trung cao", top: "Giao tiếp hàng ngày", ex: "The magician's seamless optical illusion astonished the entire international audience.", exd: "Màn ảo thuật đánh lừa thị giác mượt mà của ảo thuật gia đã làm toàn bộ khán giả quốc tế sửng sốt." },
  { w: "atmosphere", p: "/ˈæt.məs.fɪər/", t: "Danh từ", m: "Khí quyển, bầu không khí", c: "B1 - Trung cấp", top: "Môi trường & Sinh thái", ex: "The cozy fireplace created a wonderfully warm atmosphere inside the cabin.", exd: "Chiếc lò sưởi ấm cúng đã tạo ra một bầu không khí ấm áp tuyệt vời bên trong căn nhà gỗ." },
  { w: "attain", p: "/əˈteɪn/", t: "Động từ", m: "Đạt tới, gặt hái được", c: "B2 - Trung cao", top: "Giáo dục & Trường học", ex: "Through perseverance, she attained the prestigious distinction of valedictorian.", exd: "Nhờ sự kiên trì bền bỉ, cô ấy đã gặt hái được danh hiệu thủ khoa danh giá." },
  { w: "attribute", p: "/ˈæt.rɪ.bjuːt/", t: "Danh từ", m: "Thuộc tính, quy cho", c: "B2 - Trung cao", top: "Học thuật & Nghiên cứu", ex: "Patience and analytical discipline are vital attributes for successful experimentalists.", exd: "Sự kiên nhẫn và tính kỷ luật phân tích là những thuộc tính tối quan trọng đối với các nhà thực nghiệm thành công." },
  { w: "authentic", p: "/ɔːˈθen.tɪk/", t: "Tính từ", m: "Đích thực, chân thực, nguyên bản", c: "B2 - Trung cao", top: "Nghệ thuật & Văn hóa", ex: "The gallery exhibits authentic seventeenth-century oil masterworks.", exd: "Phòng trưng bày triển lãm các kiệt tác tranh sơn dầu đích thực từ thế kỷ thứ mười bảy." },
  { w: "autonomous", p: "/ɔːˈtɒn.ə.məs/", t: "Tính từ", m: "Tự chủ, tự hành", c: "C1 - Cao cấp", top: "Công nghệ & Kỹ thuật số", ex: "Autonomous electric vehicles rely on real-time LiDAR sensors to navigate metropolitan streets.", exd: "Xe điện tự hành dựa vào các cảm biến LiDAR thời gian thực để di chuyển trên đường phố đô thị." },
  { w: "available", p: "/əˈveɪ.lə.bəl/", t: "Tính từ", m: "Có sẵn, rảnh rỗi", c: "A1 - Cơ bản", top: "Giao tiếp hàng ngày", ex: "The doctor is available for medical consultations from nine to noon.", exd: "Bác sĩ có mặt sẵn sàng để tư vấn y tế từ chín giờ sáng đến trưa." },
  { w: "awareness", p: "/əˈweə.nəs/", t: "Danh từ", m: "Nhận thức, ý thức", c: "B1 - Trung cấp", top: "Tâm lý & Hành vi xã hội", ex: "Public awareness campaigns emphasize the importance of mental well-being.", exd: "Các chiến dịch nâng cao nhận thức cộng đồng nhấn mạnh tầm quan trọng của sức khỏe tinh thần." }
];

// Vocabulary synthesis lists to programmatically construct 10,000 distinct words across all CEFR/TOEIC/IELTS levels
const PREFIXES = [
  "re", "un", "in", "im", "dis", "en", "non", "over", "mis", "sub", "pre", "inter", "fore", "de", "trans",
  "super", "semi", "anti", "mid", "under", "auto", "co", "multi", "pro", "hyper", "ultra", "extra", "intra",
  "macro", "micro", "neo", "omni", "poly", "pseudo", "retro", "tele", "tri", "uni", "bi", "post"
];

// Rich vocabulary seeds encompassing Oxford 3000/5000, Academic Word List, TOEIC, and IELTS
import { LEXICON_SEED_BANK } from './seed_words.js';

export function generate10kWords() {
  const generatedMap = new Map();
  
  // 1. Add curated base words
  VOCABULARY_CORPUS.forEach((item, idx) => {
    const key = item.w.toLowerCase().trim();
    if (!generatedMap.has(key)) {
      generatedMap.set(key, {
        word_id: `en_vocab_${String(generatedMap.size + 1).padStart(5, '0')}`,
        tu: item.w,
        phien_am: item.p,
        loai_tu: item.t,
        nghia: item.m,
        cap_do: item.c,
        chu_de: item.top,
        vi_du: item.ex,
        vi_du_dich: item.exd,
        ngon_ngu: 'en',
        srs_box: 0,
        srs_next_review: new Date().toISOString(),
        srs_interval: 0,
        srs_ease: 2.5,
        times_reviewed: 0,
        times_correct: 0,
        user_id: 'user_1',
        created_at: '2026-08-31',
        nguon_goc: 'Oxford 3000/5000 & CEFR Bank'
      });
    }
  });

  // 2. Add rich lexicon seeds from the comprehensive word bank
  LEXICON_SEED_BANK.forEach((item) => {
    const key = item.tu.toLowerCase().trim();
    if (!generatedMap.has(key) && generatedMap.size < 10000) {
      generatedMap.set(key, {
        word_id: `en_vocab_${String(generatedMap.size + 1).padStart(5, '0')}`,
        tu: item.tu,
        phien_am: item.phien_am || '',
        loai_tu: item.loai_tu || 'Từ vựng',
        nghia: item.nghia,
        cap_do: item.cap_do || 'B1 - Trung cấp',
        chu_de: item.chu_de || 'Tổng hợp',
        vi_du: item.vi_du || `Understanding the term "${item.tu}" enhances your English mastery.`,
        vi_du_dich: item.vi_du_dich || `Hiểu rõ từ "${item.tu}" giúp nâng cao trình độ tiếng Anh của bạn.`,
        ngon_ngu: 'en',
        srs_box: 0,
        srs_next_review: new Date().toISOString(),
        srs_interval: 0,
        srs_ease: 2.5,
        times_reviewed: 0,
        times_correct: 0,
        user_id: 'user_1',
        created_at: '2026-08-31',
        nguon_goc: 'CEFR / TOEIC / IELTS Master Database'
      });
    }
  });

  return Array.from(generatedMap.values());
}
