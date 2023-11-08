import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import joi from 'joi';
const router = express.Router();




const createdCategory = joi.object({
    name: joi.string().min(1).max(10).required(),
});
// 1. 카테고리 등록 API
//     - 카테고리 이름을 **request**에서 전달받기
//     - 새롭게 등록된 카테고리는 **가장 마지막 순서**로 설정됩니다.
router.post('/categories', async (req, res, next) => {
    try {
        const validation = await createdCategory.validateAsync(req.body);
        const { name } = validation;
        if (!name) {
            return res.status(400).json({ errorMessage: "데이터 형식이 올바르지 않습니다." });
        }

        const findOrder = await prisma.categories.findFirst({
            select: {
                order: true,
            },
            orderBy: {
                categoryId: 'desc'
            }
        });

        const newOrder = findOrder ? findOrder.order + 1 : 1;

        await prisma.categories.create({
            data: {
                name: name,
                order: newOrder
            },
        });

        return res.status(201).json({ message: "카테고리를 등록하였습니다." });
    } catch (error) {
        if(error.name === "ValidationError"){
            return res.status(400).json({errorMessage : error.message})
        }
        console.error(error);
        return res.status(500).json({ message: "서버 오류" });
    }
});

// 2. 카테고리 조회 API
//     - 등록된 모든 카테고리의 카테고리 이름, 순서를 조회하기
//     - 조회된 카테고리는 지정된 순서대로 정렬됩니다.
router.get('/categories', async (req, res, next) => {
    try {
        const category = await prisma.categories.findMany({
            select: {
                categoryId: true,
                name: true,
                order: true
            }
        });
        return res.status(200).json({ data: category });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "서버 오류" });
    }
});



// 3. 카테고리 수정 API
//     - 카테고리 이름, 순서를 **request**에서 전달받기
//     - 선택한 카테고리가 존재하지 않을 경우, “존재하지 않는 카테고리입니다." 메시지 반환하기
router.put('/categories/:categoryId', async (req, res, next) => {
    try {
        const { name, order } = req.body;
        const { categoryId } = req.params;
        if (!(name && order)) {
            return res.status(400).json({ message: "데이터 형식이 올바르지 않습니다." });
        }
        if(!categoryId){
            return res.status(400).json({ message: "데이터 형식이 올바르지 않습니다." });
        }
        
        const UpdateCategory = await prisma.categories.update({
            where: { categoryId: +categoryId },
            data: {
                name: name,
                order: order,
            }
        });
        if (!UpdateCategory) {
            return res.status(404).json({ message: "존재하지 않는 카테고리 입니다." });
        }
        return res.status(201).json({ message: "카테고리 정보를 수정하였습니다." });
    } catch (error) {
        if(error.name === "ValidationError"){
            return res.status(400).json({errorMessage : error.message})
        }
        console.error(error);
        return res.status(500).json({ message: "서버 오류" });
    }
});


// 4. 카테고리 삭제 API
//     - 선택한 카테고리 삭제하기
//     - 카테고리 삭제 시, 해당 카테고리에 **연관된 모든 메뉴도 함께 삭제**됩니다.
//     - 선택한 카테고리가 존재하지 않을 경우, “존재하지 않는 카테고리입니다." 메시지 반환하기
router.delete('/categories/:categoryId', async (req, res) => {
    try {
        const { categoryId } = req.params;
        if (!categoryId) {
            return res.status(400).json({ message: "데이터 형식이 올바르지 않습니다." });
        }
        const findCategory = await prisma.categories.findFirst({
            where: { categoryId: +categoryId }
        });
        if (!findCategory) {
            return res.status(404).json({ message: "해당하는 카테고리가 존재하지 않습니다." });
        } else {
            await prisma.categories.delete({
                where: { categoryId: +categoryId }
            });
        }
        return res.status(201).json({ message: "데이터가 삭제되었습니다." });
    } catch (error) {
        console.error("An error occurred:", error);
        return res.status(500).json({ message: "서버 오류가 발생했습니다." });
    }
});

export default router;