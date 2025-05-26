const { PrismaClient } = require('@prisma/client')
const { isFaceMatch } = require('./face-similarity')
const prisma = new PrismaClient()

async function testFaceAuth() {
    try {
        const newMemberId = 'TEST002'

        // 0. 清理可能存在的測試用戶
        try {
            await prisma.member.delete({
                where: { mid: newMemberId }
            })
        } catch (e) {
            // 忽略刪除錯誤
        }

        // 1. 模擬註冊流程
        console.log('===== 測試註冊流程 =====')
        const mockFaceDescriptor = Array(128).fill(0).map(() => Math.random())

        // 建立新會員（模擬註冊）
        const newMember = await prisma.member.create({
            data: {
                mid: newMemberId,
                name: '測試用戶2',
                email: 'test2@example.com',
                phonenumber: '0912345679',
                face_descriptor: mockFaceDescriptor
            }
        })

        console.log('註冊成功:', {
            mid: newMember.mid,
            name: newMember.name,
            hasFaceDescriptor: newMember.face_descriptor !== null,
            descriptorLength: newMember.face_descriptor.length
        })

        // 驗證儲存的資料
        const savedMember = await prisma.member.findUnique({
            where: { mid: newMemberId }
        })

        console.log('儲存的資料:', {
            mid: savedMember.mid,
            descriptorType: typeof savedMember.face_descriptor,
            descriptorLength: savedMember.face_descriptor?.length,
            descriptorSample: savedMember.face_descriptor?.slice(0, 5)
        })

        // 2. 模擬登入流程
        console.log('\n===== 測試登入流程 =====')

        // 2.1 模擬成功的登入（使用相同的人臉特徵）
        const allMembers = await prisma.member.findMany({
            where: {
                face_descriptor: {
                    isEmpty: false
                }
            },
            select: {
                mid: true,
                name: true,
                face_descriptor: true
            }
        })

        console.log('找到的會員數量:', allMembers.length)
        if (allMembers.length > 0) {
            console.log('第一個會員的資料:', {
                mid: allMembers[0].mid,
                descriptorType: typeof allMembers[0].face_descriptor,
                descriptorLength: allMembers[0].face_descriptor?.length,
                descriptorSample: allMembers[0].face_descriptor?.slice(0, 5)
            })
        }

        // 找出最佳匹配
        let bestMatch = null
        let highestConfidence = 0

        for (const member of allMembers) {
            try {
                const matchResult = isFaceMatch(mockFaceDescriptor, member.face_descriptor, {
                    euclideanThreshold: 0.6,
                    cosineThreshold: 0.7
                })

                if (matchResult.isMatch && matchResult.confidence > highestConfidence) {
                    bestMatch = {
                        member,
                        matchResult
                    }
                    highestConfidence = matchResult.confidence
                }
            } catch (error) {
                console.error('比對時發生錯誤:', {
                    memberId: member.mid,
                    error: error.message
                })
            }
        }

        console.log('正確人臉登入結果:', bestMatch ? {
            found: true,
            matchedMember: {
                mid: bestMatch.member.mid,
                name: bestMatch.member.name
            },
            confidence: bestMatch.matchResult.confidence,
            euclideanDistance: bestMatch.matchResult.euclideanDistance,
            cosineSimilarity: bestMatch.matchResult.cosineSimilarity
        } : {
            found: false
        })

        // 2.2 模擬失敗的登入（使用不同的人臉特徵）
        const wrongFaceDescriptor = Array(128).fill(0).map(() => Math.random())

        // 重置最佳匹配
        bestMatch = null
        highestConfidence = 0

        for (const member of allMembers) {
            try {
                const matchResult = isFaceMatch(wrongFaceDescriptor, member.face_descriptor, {
                    euclideanThreshold: 0.6,
                    cosineThreshold: 0.7
                })

                if (matchResult.isMatch && matchResult.confidence > highestConfidence) {
                    bestMatch = {
                        member,
                        matchResult
                    }
                    highestConfidence = matchResult.confidence
                }
            } catch (error) {
                console.error('比對時發生錯誤:', {
                    memberId: member.mid,
                    error: error.message
                })
            }
        }

        console.log('錯誤人臉登入結果:', bestMatch ? {
            found: true,
            matchedMember: {
                mid: bestMatch.member.mid,
                name: bestMatch.member.name
            },
            confidence: bestMatch.matchResult.confidence,
            euclideanDistance: bestMatch.matchResult.euclideanDistance,
            cosineSimilarity: bestMatch.matchResult.cosineSimilarity
        } : {
            found: false
        })

        // 2.3 模擬相似人臉（稍微修改原始特徵）
        const similarFaceDescriptor = mockFaceDescriptor.map(value =>
            value + (Math.random() - 0.5) * 0.1 // 添加小幅度隨機變化
        )

        // 重置最佳匹配
        bestMatch = null
        highestConfidence = 0

        for (const member of allMembers) {
            try {
                const matchResult = isFaceMatch(similarFaceDescriptor, member.face_descriptor, {
                    euclideanThreshold: 0.6,
                    cosineThreshold: 0.7
                })

                if (matchResult.isMatch && matchResult.confidence > highestConfidence) {
                    bestMatch = {
                        member,
                        matchResult
                    }
                    highestConfidence = matchResult.confidence
                }
            } catch (error) {
                console.error('比對時發生錯誤:', {
                    memberId: member.mid,
                    error: error.message
                })
            }
        }

        console.log('相似人臉登入結果:', bestMatch ? {
            found: true,
            matchedMember: {
                mid: bestMatch.member.mid,
                name: bestMatch.member.name
            },
            confidence: bestMatch.matchResult.confidence,
            euclideanDistance: bestMatch.matchResult.euclideanDistance,
            cosineSimilarity: bestMatch.matchResult.cosineSimilarity
        } : {
            found: false
        })

        // 3. 清理測試資料
        await prisma.member.delete({
            where: {
                mid: newMemberId
            }
        })
        console.log('\n測試資料已清理')

    } catch (error) {
        console.error('測試過程中發生錯誤:', error)
    } finally {
        await prisma.$disconnect()
    }
}

// 執行測試
testFaceAuth() 