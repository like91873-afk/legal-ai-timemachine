require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// 文件上传配置
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// ==================== 诉讼费计算（中国标准） ====================
function calcCourtFee(amount) {
  if (amount <= 0) return 0;
  if (amount <= 10000) return 50;
  if (amount <= 100000) return Math.round(amount * 0.025 - 200);
  if (amount <= 200000) return Math.round(amount * 0.02 + 300);
  if (amount <= 500000) return Math.round(amount * 0.015 + 1300);
  if (amount <= 1000000) return Math.round(amount * 0.01 + 3800);
  if (amount <= 2000000) return Math.round(amount * 0.009 + 4800);
  if (amount <= 5000000) return Math.round(amount * 0.008 + 5800);
  if (amount <= 10000000) return Math.round(amount * 0.007 + 6800);
  if (amount <= 20000000) return Math.round(amount * 0.006 + 7800);
  return Math.round(amount * 0.005 + 8800);
}

// ==================== 律师费估算 ====================
function calcLawyerFee(amount) {
  if (amount <= 10000) return 3000;
  if (amount <= 100000) return Math.round(amount * 0.08 + 2000);
  if (amount <= 500000) return Math.round(amount * 0.06 + 4000);
  if (amount <= 1000000) return Math.round(amount * 0.05 + 8000);
  if (amount <= 5000000) return Math.round(amount * 0.04 + 15000);
  return Math.round(amount * 0.03 + 30000);
}

// ==================== 模拟 AI 分析 ====================
function mockAnalyze(caseType, description, amount) {
  const typeWeights = { '民事纠纷': 0.72, '合同纠纷': 0.68, '刑事辩护': 0.45, '劳动纠纷': 0.75, '其他': 0.6 };
  const baseRate = typeWeights[caseType] || 0.6;
  const descBonus = Math.min(description.length / 500, 0.15);
  const winRate = Math.max(20, Math.min(Math.round((baseRate + descBonus + (Math.random() * 0.1 - 0.05)) * 100), 95));

  const missingEvidenceMap = {
    '合同纠纷': [
      { name: '书面合同原件', priority: 'critical', suggestion: '联系对方补签，或查找邮件/微信中的合同确认记录' },
      { name: '付款/转账凭证', priority: 'critical', suggestion: '从银行打印转账流水，标注相关交易' },
      { name: '沟通记录截图', priority: 'important', suggestion: '整理微信/短信中与合同履行相关的聊天记录' },
      { name: '催告函/律师函', priority: 'helpful', suggestion: '如未发送，建议先发一份书面催告函并保留送达凭证' }
    ],
    '民事纠纷': [
      { name: '事件现场证据', priority: 'critical', suggestion: '照片、视频、监控录像等' },
      { name: '证人证言', priority: 'important', suggestion: '联系在场证人，请其书写书面证言并签字' },
      { name: '损失证明', priority: 'critical', suggestion: '收集维修发票、医疗费收据、误工证明等' },
      { name: '报警记录', priority: 'helpful', suggestion: '如有报警，去派出所调取报警回执和笔录' }
    ],
    '劳动纠纷': [
      { name: '劳动合同', priority: 'critical', suggestion: '如无纸质合同，可提供工资流水、打卡记录证明事实劳动关系' },
      { name: '工资流水', priority: 'critical', suggestion: '去银行打印近 12 个月工资入账记录' },
      { name: '解除通知', priority: 'important', suggestion: '保留公司发出的辞退通知、协商记录' },
      { name: '加班记录', priority: 'helpful', suggestion: '整理考勤截图、加班审批记录、工作群消息' }
    ],
    '刑事辩护': [
      { name: '不在场证明', priority: 'critical', suggestion: '收集监控录像、消费记录、定位数据等' },
      { name: '证人证言', priority: 'critical', suggestion: '联系可证明相关事实的证人' },
      { name: '物证/书证', priority: 'important', suggestion: '保留所有与案件相关的实物和书面材料' },
      { name: '鉴定报告', priority: 'helpful', suggestion: '如涉及伤情/物证，申请司法鉴定' }
    ],
    '其他': [
      { name: '相关书面材料', priority: 'critical', suggestion: '收集与纠纷相关的所有书面文件' },
      { name: '沟通记录', priority: 'important', suggestion: '整理微信、短信、邮件等沟通记录' },
      { name: '第三方证据', priority: 'helpful', suggestion: '寻找可佐证的第三方材料' }
    ]
  };

  const defenseMap = {
    '合同纠纷': [
      { strategy: '主张合同无效或可撤销', likelihood: 'medium', countermeasure: '准备合同签署时的录音或见证人证言，证明双方真实意思表示' },
      { strategy: '主张已履行完毕', likelihood: 'high', countermeasure: '准备对方未完全履行的证据，如验收不合格记录、质量异议函' },
      { strategy: '主张不可抗力免责', likelihood: 'low', countermeasure: '收集当时市场环境数据，证明不存在不可抗力情形' }
    ],
    '民事纠纷': [
      { strategy: '否认因果关系', likelihood: 'high', countermeasure: '准备鉴定报告、专家意见证明因果关系' },
      { strategy: '主张受害人有过错', likelihood: 'medium', countermeasure: '准备证据证明己方已尽到合理注意义务' },
      { strategy: '质疑损失金额', likelihood: 'high', countermeasure: '准备完整的损失凭证和第三方评估报告' }
    ],
    '劳动纠纷': [
      { strategy: '否认劳动关系', likelihood: 'medium', countermeasure: '准备工资流水、工作证、同事证言等证明事实劳动关系' },
      { strategy: '主张合法解除', likelihood: 'high', countermeasure: '审查公司解除程序是否合法，是否经过工会' },
      { strategy: '主张员工自动离职', likelihood: 'low', countermeasure: '准备出勤记录、请假审批等证明非自愿离职' }
    ],
    '刑事辩护': [
      { strategy: '质疑证据合法性', likelihood: 'high', countermeasure: '审查取证程序是否合法，申请排除非法证据' },
      { strategy: '主张正当防卫', likelihood: 'medium', countermeasure: '准备现场证据，证明防卫的紧迫性和必要性' },
      { strategy: '申请取保候审', likelihood: 'medium', countermeasure: '准备保证人或保证金，证明无社会危险性' }
    ],
    '其他': [
      { strategy: '质疑主体资格', likelihood: 'medium', countermeasure: '准备证明当事人主体资格的相关材料' },
      { strategy: '主张超过诉讼时效', likelihood: 'low', countermeasure: '准备诉讼时效中断的证据，如催告记录' }
    ]
  };

  const durationMap = {
    '民事纠纷': '3-6 个月',
    '合同纠纷': '4-8 个月',
    '刑事辩护': '6-12 个月',
    '劳动纠纷': '2-4 个月',
    '其他': '3-6 个月'
  };

  const lawBasisMap = {
    '合同纠纷': '根据《民法典》第五百零九条、第五百七十七条，当事人应当按照约定全面履行自己的义务，违约方应承担继续履行、采取补救措施或者赔偿损失等违约责任。',
    '民事纠纷': '根据《民法典》第一千一百六十五条，行为人因过错侵害他人民事权益造成损害的，应当承担侵权责任。',
    '劳动纠纷': '根据《劳动合同法》第四十六条、第四十七条，用人单位依法解除劳动合同应支付经济补偿，标准为每工作一年支付一个月工资。',
    '刑事辩护': '根据《刑法》及相关司法解释，辩护人应从犯罪构成要件、证据合法性、量刑情节等方面进行辩护。',
    '其他': '根据相关法律法规，建议结合具体案情进一步分析适用法条。'
  };

  const courtFee = calcCourtFee(amount);
  const lawyerFee = calcLawyerFee(amount);
  const expectedReturn = Math.round(amount * winRate / 100);
  const netReturn = expectedReturn - courtFee - lawyerFee;

  let recommendation;
  if (netReturn > amount * 0.3) recommendation = 'worth';
  else if (netReturn > 0) recommendation = 'cautious';
  else recommendation = 'settle';

  return {
    winRate,
    winRateLevel: winRate >= 80 ? 'high' : winRate >= 50 ? 'medium' : 'low',
    judgmentBasis: lawBasisMap[caseType] || lawBasisMap['其他'],
    costBreakdown: {
      courtFee,
      lawyerFee,
      timeCost: durationMap[caseType] || durationMap['其他'],
      totalCost: courtFee + lawyerFee
    },
    expectedReturn,
    netReturn,
    recommendation,
    missingEvidence: missingEvidenceMap[caseType] || missingEvidenceMap['其他'],
    opponentDefense: defenseMap[caseType] || defenseMap['其他']
  };
}

// ==================== API 路由 ====================
app.post('/api/analyze', upload.array('files', 5), (req, res) => {
  try {
    const { caseType, description, amount } = req.body;

    if (!caseType || !description || !amount || Number(amount) <= 0) {
      return res.status(400).json({ error: '请填写完整信息，金额必须大于 0' });
    }

    // 模拟 AI 分析延迟
    setTimeout(() => {
      const result = mockAnalyze(caseType, description, Number(amount));
      res.json(result);
    }, 1500 + Math.random() * 1000);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '分析失败，请稍后重试' });
  }
});

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`\n⚖️  法律时光机已启动: http://localhost:${PORT}\n`);
});
