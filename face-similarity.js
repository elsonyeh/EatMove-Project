/**
 * 確保輸入是數字陣列
 */
function ensureNumberArray(vector) {
    if (typeof vector === 'string') {
        // 如果是字串形式的陣列，轉換為數字陣列
        return vector.replace(/[\[\]]/g, '').split(',').map(Number)
    }
    return vector
}

/**
 * 計算兩個特徵向量之間的歐氏距離
 * 距離越小表示越相似
 */
function calculateEuclideanDistance(vector1, vector2) {
    // 確保輸入是數字陣列
    vector1 = ensureNumberArray(vector1)
    vector2 = ensureNumberArray(vector2)

    if (vector1.length !== vector2.length) {
        throw new Error(`特徵向量長度不匹配: ${vector1.length} vs ${vector2.length}`)
    }

    return Math.sqrt(
        vector1.reduce((sum, value, index) => {
            const diff = value - vector2[index]
            return sum + diff * diff
        }, 0)
    )
}

/**
 * 計算兩個特徵向量之間的餘弦相似度
 * 相似度範圍為 -1 到 1，越接近 1 表示越相似
 */
function calculateCosineSimilarity(vector1, vector2) {
    // 確保輸入是數字陣列
    vector1 = ensureNumberArray(vector1)
    vector2 = ensureNumberArray(vector2)

    if (vector1.length !== vector2.length) {
        throw new Error(`特徵向量長度不匹配: ${vector1.length} vs ${vector2.length}`)
    }

    // 計算點積
    const dotProduct = vector1.reduce((sum, value, index) => {
        return sum + value * vector2[index]
    }, 0)

    // 計算向量長度
    const magnitude1 = Math.sqrt(vector1.reduce((sum, value) => sum + value * value, 0))
    const magnitude2 = Math.sqrt(vector2.reduce((sum, value) => sum + value * value, 0))

    // 避免除以零
    if (magnitude1 === 0 || magnitude2 === 0) {
        return 0
    }

    return dotProduct / (magnitude1 * magnitude2)
}

/**
 * 判斷兩個人臉特徵是否匹配
 * @param {Array<number>} vector1 - 第一個特徵向量
 * @param {Array<number>} vector2 - 第二個特徵向量
 * @param {Object} options - 配置選項
 * @param {number} options.euclideanThreshold - 歐氏距離閾值（建議值：0.6）
 * @param {number} options.cosineThreshold - 餘弦相似度閾值（建議值：0.7）
 * @returns {Object} 匹配結果
 */
function isFaceMatch(vector1, vector2, options = {}) {
    const {
        euclideanThreshold = 0.6,
        cosineThreshold = 0.7
    } = options

    const euclideanDistance = calculateEuclideanDistance(vector1, vector2)
    const cosineSimilarity = calculateCosineSimilarity(vector1, vector2)

    return {
        isMatch: euclideanDistance <= euclideanThreshold && cosineSimilarity >= cosineThreshold,
        euclideanDistance,
        cosineSimilarity,
        confidence: (1 - euclideanDistance + cosineSimilarity) / 2
    }
}

module.exports = {
    calculateEuclideanDistance,
    calculateCosineSimilarity,
    isFaceMatch
} 