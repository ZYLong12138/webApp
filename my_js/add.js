import { supabase } from '../lib/supabase';
import fs from 'fs';
import path from 'path';

// 配置
const config = {
  bucket: 'word-audio',
  localRoot: 'F:/BaiduNetdiskDownload/142000',
  batchSize: 10, // 批量处理大小
  retryCount: 3, // 重试次数
  retryDelay: 1000, // 重试延迟(ms)
};

// 日志记录
const logger = {
  info: (message) => console.log(`ℹ️ ${message}`),
  success: (message) => console.log(`✅ ${message}`),
  error: (message) => console.log(`❌ ${message}`),
  warning: (message) => console.log(`⚠️ ${message}`),
};

// 重试函数
async function retry(fn, retries = config.retryCount, delay = config.retryDelay) {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;
    await new Promise(resolve => setTimeout(resolve, delay));
    return retry(fn, retries - 1, delay);
  }
}

// 上传单个音频文件
async function uploadAudioFile(word, audioPath) {
  const lowerWord = word.toLowerCase();
  const storagePath = `audio/${lowerWord}.wav`;

  try {
    const buffer = fs.readFileSync(audioPath);
    
    // 上传到存储桶
    const { error: uploadError } = await retry(() => 
      supabase.storage
        .from(config.bucket)
        .upload(storagePath, buffer, {
          contentType: 'audio/wav',
          upsert: true
        })
    );

    if (uploadError) {
      logger.error(`上传失败 ${lowerWord}: ${uploadError.message}`);
      return false;
    }

    // 更新数据库
    const { error: dbError } = await retry(() =>
      supabase
        .from('word_list')
        .update({ vedio: storagePath })
        .eq('word', word)
    );

    if (dbError) {
      logger.warning(`数据库更新失败 ${lowerWord}: ${dbError.message}`);
      return false;
    }

    logger.success(`上传并更新成功：${lowerWord}`);
    return true;
  } catch (error) {
    logger.error(`处理 ${lowerWord} 时发生错误: ${error.message}`);
    return false;
  }
}

// 批量处理函数
async function processBatch(words, batchSize) {
  const results = {
    success: 0,
    failed: 0,
    notFound: 0
  };
  const notFoundWords = [];

  for (let i = 0; i < words.length; i += batchSize) {
    const batch = words.slice(i, i + batchSize);
    const promises = batch.map(async ({ word }) => {
      const lowerWord = word.toLowerCase();
      const firstLetter = lowerWord[0];
      const audioPath = path.join(config.localRoot, firstLetter, `${lowerWord}.wav`);

      if (!fs.existsSync(audioPath)) {
        notFoundWords.push(lowerWord);
        results.notFound++;
        return;
      }

      const success = await uploadAudioFile(word, audioPath);
      if (success) {
        results.success++;
      } else {
        results.failed++;
      }
    });

    await Promise.all(promises);
    logger.info(`处理进度: ${i + batch.length}/${words.length}`);
  }

  return { results, notFoundWords };
}

async function main() {
  try {
    logger.info('开始获取单词列表...');
    const { data: words, error } = await supabase
      .from('word_list')
      .select('word');

    if (error) {
      throw new Error(`获取单词失败: ${error.message}`);
    }

    logger.info(`共获取到 ${words.length} 个单词`);
    const { results, notFoundWords } = await processBatch(words, config.batchSize);

    // 记录未找到的单词
    if (notFoundWords.length > 0) {
      const missingFilePath = path.join(config.localRoot, 'missing_audio.txt');
      fs.writeFileSync(missingFilePath, notFoundWords.join('\n'), 'utf8');
      logger.warning(`未找到音频的单词已写入: ${missingFilePath}`);
    }

    // 输出统计信息
    logger.info('\n处理结果统计:');
    logger.info(`成功: ${results.success}`);
    logger.info(`失败: ${results.failed}`);
    logger.info(`未找到音频: ${results.notFound}`);
    logger.success('所有任务完成');

  } catch (error) {
    logger.error(`程序执行失败: ${error.message}`);
    process.exit(1);
  }
}

main();
