/**
 * 加密工具类 - TypeScript版本
 * 对应Java EncryptionUtils类的前端实现
 * 使用crypto-js和jsencrypt库实现
 */

import CryptoJS from 'crypto-js';
import JSEncrypt from 'jsencrypt';
import forge from 'node-forge';

// AES加密配置
const AES_ALGORITHM = 'AES/ECB/PKCS7Padding';
const AES_KEY_SIZE = 256;

// RSA加密配置 - 明确指定PKCS1Padding填充方式
const RSA_ALGORITHM = 'RSA/ECB/PKCS1Padding';
const RSA_KEY_SIZE = 2048;

/**
 * 将密钥转换为Base64编码字符串（兼容原有接口）
 * @param {string} key 密钥
 * @returns {string} Base64编码的密钥字符串
 */
export const keyToString = (key: string): string => {
  // jsencrypt已经返回Base64编码的字符串，直接返回
  return key;
};

/**
 * 使用RSA公钥加密数据 - 使用node-forge
 */
export const encryptWithRSA = (data: string, publicKey: string): string => {
  // 将纯Base64编码的公钥转换为PEM格式
  const pemPublicKey = `-----BEGIN PUBLIC KEY-----\n${publicKey}\n-----END PUBLIC KEY-----`;
  
  // 使用PEM格式的公钥进行加密
  const pubKey = forge.pki.publicKeyFromPem(pemPublicKey);
  
  const encrypted = pubKey.encrypt(data, 'RSAES-PKCS1-V1_5');
  return forge.util.encode64(encrypted); // 转为Base64
};

/**
 * 使用RSA私钥解密数据
 * 使用RSA/ECB/PKCS1Padding填充方式
 * @param {string} encryptedData Base64编码的加密数据
 * @param {string} privateKey RSA私钥
 * @returns {string} 解密后的原始数据
 */
export const decryptWithRSA = (encryptedData: string, privateKey: string): string => {
  const decrypt = new JSEncrypt();
  decrypt.setPrivateKey(privateKey);
  // JSEncrypt默认使用PKCS1Padding填充
  return decrypt.decrypt(encryptedData) || '';
};

/**
 * 从Base64编码的字符串恢复RSA公钥（兼容原有接口）
 * @param {string} keyStr Base64编码的公钥字符串
 * @returns {string} RSA公钥字符串
 */
export const stringToRSAPublicKey = (keyStr: string): string => {
  return keyStr;
};

/**
 * 从Base64编码的字符串恢复RSA私钥（兼容原有接口）
 * @param {string} keyStr Base64编码的私钥字符串
 * @returns {string} RSA私钥字符串
 */
export const stringToRSAPrivateKey = (keyStr: string): string => {
  return keyStr;
};

/**
 * 生成随机AES密钥
 * @returns {string} Base64编码的AES密钥
 */
export const generateAESKey = (): string => {
  const key = CryptoJS.lib.WordArray.random(AES_KEY_SIZE / 8);
  return CryptoJS.enc.Base64.stringify(key);
};

/**
 * 从Base64编码的字符串恢复AES密钥（兼容原有接口）
 * @param {string} keyStr Base64编码的AES密钥字符串
 * @returns {string} AES密钥字符串
 */
export const stringToAESKey = (keyStr: string): string => {
  return keyStr;
};

/**
 * 使用AES密钥加密数据
 * @param {string} data 待加密数据
 * @param {string} key Base64编码的AES密钥
 * @returns {string} Base64编码的加密数据
 */
export const encryptWithAES = (data: string, key: string): string => {
  const keyWordArray = CryptoJS.enc.Base64.parse(key);
  
  const encrypted = CryptoJS.AES.encrypt(data, keyWordArray, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7
  });
  
  return encrypted.toString();
};

/**
 * 使用AES密钥解密数据
 * @param {string} encryptedData Base64编码的加密数据
 * @param {string} key Base64编码的AES密钥
 * @returns {string} 解密后的原始数据
 */
export const decryptWithAES = (encryptedData: string, key: string): string => {
  const keyWordArray = CryptoJS.enc.Base64.parse(key);
  
  const decrypted = CryptoJS.AES.decrypt(encryptedData, keyWordArray, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7
  });
  
  return decrypted.toString(CryptoJS.enc.Utf8);
};

/**
 * 将WordArray转换为Base64编码字符串
 * @param {CryptoJS.lib.WordArray} wordArray WordArray对象
 * @returns {string} Base64编码的字符串
 */
export const wordArrayToBase64 = (wordArray: CryptoJS.lib.WordArray): string => {
  return CryptoJS.enc.Base64.stringify(wordArray);
};

/**
 * 将Base64编码字符串转换为WordArray
 * @param {string} base64Str Base64编码的字符串
 * @returns {CryptoJS.lib.WordArray} WordArray对象
 */
export const base64ToWordArray = (base64Str: string): CryptoJS.lib.WordArray => {
  return CryptoJS.enc.Base64.parse(base64Str);
};

// /**
//  * RSA加密测试函数
//  * 验证RSA/ECB/PKCS1Padding填充方式是否正常工作
//  */
// export const testRSAEncryption = (): void => {
//   try {
//     console.log('=== RSA/ECB/PKCS1Padding 加密测试 ===');
    
//     // 生成RSA密钥对
//     const rsaKeyPair = generateRSAKeyPair();
//     console.log('RSA公钥:', rsaKeyPair.publicKey);
//     console.log('RSA私钥:', rsaKeyPair.privateKey);
    
//     // 测试数据
//     const testData = '这是一个RSA/ECB/PKCS1Padding填充方式的测试数据';
//     console.log('原始数据:', testData);
    
//     // RSA加密
//     const encrypted = encryptWithRSA(testData, rsaKeyPair.publicKey);
//     console.log('RSA加密后:', encrypted);
    
//     // RSA解密
//     const decrypted = decryptWithRSA(encrypted, rsaKeyPair.privateKey);
//     console.log('RSA解密后:', decrypted);
    
//     // 验证加密解密结果一致性
//     if (testData === decrypted) {
//       console.log('✅ RSA加密解密测试成功！');
//       console.log('✅ 使用的填充方式: RSA/ECB/PKCS1Padding');
//     } else {
//       console.log('❌ RSA加密解密测试失败！');
//     }
    
//   } catch (error) {
//     console.error('RSA加密测试错误:', error);
//   }
// };

// /**
//  * 完整加密流程测试函数
//  */
// export const testFullEncryptionFlow = (): void => {
//   try {
//     console.log('\n=== 完整加密流程测试 ===');
    
//     // 1. 生成RSA密钥对
//     const rsaKeyPair = generateRSAKeyPair();
    
//     // 2. 生成AES密钥
//     const aesKey = generateAESKey();
//     console.log('生成的AES密钥:', aesKey);
    
//     // 3. 使用RSA公钥加密AES密钥
//     const encryptedAesKey = encryptWithRSA(aesKey, rsaKeyPair.publicKey);
//     console.log('RSA加密后的AES密钥:', encryptedAesKey);
    
//     // 4. 使用RSA私钥解密AES密钥
//     const decryptedAesKey = decryptWithRSA(encryptedAesKey, rsaKeyPair.privateKey);
//     console.log('RSA解密后的AES密钥:', decryptedAesKey);
    
//     // 5. 使用AES密钥加密数据
//     const testData = '这是一个完整加密流程的测试数据';
//     const encryptedData = encryptWithAES(testData, aesKey);
//     console.log('AES加密后的数据:', encryptedData);
    
//     // 6. 使用AES密钥解密数据
//     const decryptedData = decryptWithAES(encryptedData, decryptedAesKey);
//     console.log('AES解密后的数据:', decryptedData);
    
//     // 7. 验证结果
//     if (testData === decryptedData && aesKey === decryptedAesKey) {
//       console.log('✅ 完整加密流程测试成功！');
//     } else {
//       console.log('❌ 完整加密流程测试失败！');
//     }
    
//   } catch (error) {
//     console.error('完整加密流程测试错误:', error);
//   }
// };