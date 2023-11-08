import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import joi from 'joi';

const router = express.Router();


// 5. 메뉴 등록 API
//     - 메뉴 이름, 설명, 이미지, 가격을 **request**에서 전달받기
//     - 새롭게 등록된 메뉴는 **가장 마지막 순서**로 설정됩니다.
//     - 메뉴는 두 가지 상태, **판매 중(`FOR_SALE`)및 매진(`SOLD_OUT`)** 을 가질 수 있습니다.
//     - 메뉴 등록 시 기본 상태는 **판매 중(`FOR_SALE`)** 입니다.
//     - 가격이 0원 이하일 경우, “메뉴 가격은 0보다 작을 수 없습니다.” 메시지 반환하기
const createdMenus = joi.object({
    name: joi.string().min(1).max(15),
    description: joi.string().min(1).max(50),
    price: joi.number().integer(),
    status: joi.string().valid("FOR_SALE", "SOLD_OUT"),
    image : joi.string(),
    order : joi.number().integer()
})

router.post('/categories/:categoryId/menus', async (req, res, next) => {
    try {
        const { categoryId } = req.params;
        const validation = await createdMenus.validateAsync(req.body);
        const { name, description, price, image, status } = validation;
        const findCategoryId = await prisma.categories.findFirst({
            where: { categoryId: +categoryId },
        });
        if (!findCategoryId) {
            return res.status(404).json({ message: "해당하는 카테고리가 없습니다." });
        }
        const findOrder = await prisma.menus.findFirst({
            select: { order: true },
            orderBy: {
                order: 'desc',
            },
        });
        const newOrder = findOrder ? findOrder.order + 1 : 1;

        await prisma.menus.create({
            data: {
                CategoryId: +categoryId,
                name: name,
                description: description,
                image: image,
                price: price,
                order: newOrder,
                status : status
            },
        });
        return res.status(200).json({ message: "메뉴를 등록하였습니다." });
    } catch (error) {
        if(error.name === "ValidationError"){
            return res.status(400).json({errorMessage : error.message})
        }
        console.error(error);
        return res.status(500).json({ message: "서버 오류" });
    }
});

// 6. 카테고리별 메뉴 조회 API
//     - 선택한 카테고리의 메뉴 이름, 이미지, 가격, 순서, 판매 상태 조회하기
//     - 조회된 메뉴는 지정된 순서에 따라 정렬됩니다.
router.get('/categories/:categoryId/menus', async (req, res, next) => {
    try {
        const { categoryId } = req.params;

        const findCategory = await prisma.categories.findFirst({
            where: { categoryId: +categoryId },
        });
        if (!findCategory) {
            return res.status(404).json({ message: "해당하는 카테고리가 없습니다." });
        }

        const menusList = await prisma.menus.findMany({
            select: {
                CategoryId: true,
                name: true,
                image: true,
                price: true,
                order: true,
                status: true,
            },
        });

        if (menusList.price <= 0) {
            return res.status(400).json({ message: "가격은 0보다 작을 수 없습니다." });
        }
        return res.status(200).json({ data: menusList });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "서버 오류" });
    }
});

// 7. 메뉴 상세 조회 API
//     - 선택한 카테고리의 메뉴 이름, 설명, 이미지, 가격, 순서, 판매 상태 조회하기
router.get('/categories/:categoryId/menus/:menusId', async (req, res, next) => {
    try {
        const { categoryId, menusId } = req.params;
        if (!categoryId || !menusId) {
            return res.status(400).json({ message: "데이터 형식이 올바르지 않습니다." });
        }
        const findCategory = await prisma.categories.findFirst({
            where: { categoryId: +categoryId },
        });
        if (!findCategory) {
            return res.status(404).json({ message: "존재하지 않는 카테고리 입니다." });
        }
        const findMenus = await prisma.menus.findFirst({
            where: { CategoryId: +categoryId, menusId: +menusId },
            select: {
                menusId: true,
                name: true,
                description: true,
                image: true,
                price: true,
                order: true,
                status: true,
            },
        });
        return res.status(200).json({ data: findMenus });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "서버 오류" });
    }
});
// 8. 메뉴 수정 API
//     - 메뉴 이름, 설명, 이미지, 가격, 순서, 판매 상태를 **request**에서 전달받기
//     - 가격이 0원 이하일 경우, “메뉴 가격은 0보다 작을 수 없습니다.” 메시지 반환하기
//     - 선택한 메뉴가 존재하지 않을 경우, “존재하지 않는 메뉴입니다." 메시지 반환하기

router.put('/categories/:categoryId/menus/:menusId', async (req, res, next) => {
    try {
        const validation = await createdMenus.validateAsync(req.body);
        const { name, description, price, order, status } = validation;
        const { categoryId, menusId } = req.params;
        if (price <= 0) {
            return res.status(400).json({ message: "가격은 0보다 작을 수 없습니다." });
        }
        const findCategory = await prisma.categories.findFirst({
            where: { categoryId: +categoryId }
        });
        if (!findCategory) {
            return res.status(404).json({ message: "해당하는 카테고리가 존재하지 않습니다." });
        }
        const findMenus = await prisma.menus.findFirst({
            where: { menusId: +menusId, CategoryId: +categoryId }
        });
        if (!findMenus) {
            return res.status(404).json({ message: "존재하지 않는 메뉴입니다." });
        }
        await prisma.menus.update({
            where: { menusId: +menusId, CategoryId: +categoryId },
            data: {
                name: name,
                description: description,
                price: price,
                order: order,
                status: status,
            }
        });
        return res.status(200).json({ message: "수정완료" });
    } catch (error) {
        if(error.name === "ValidationError"){
            return res.status(400).json({errorMessage : error.message})
        }
        console.error(error);
        return res.status(500).json({ message: "서버 오류" });
    }
});

// 9. 메뉴 삭제 API
//     - 선택한 메뉴 삭제하기
//     - 선택한 메뉴가 존재하지 않을 경우, “존재하지 않는 메뉴입니다." 메시지 반환하기
router.delete('/categories/:categoryId/menus/:menusId', async (req, res) => {
    try {
        const { categoryId, menusId } = req.params;
        const findCategory = await prisma.categories.findFirst({
            where: { categoryId: +categoryId }
        });
        if (!findCategory) {
            return res.status(404).json({ message: "카테고리가 존재하지 않습니다." });
        }
        const findMenus = await prisma.menus.findFirst({
            where: { CategoryId: +categoryId, menusId: +menusId },
        });
        if (!findMenus) {
            return res.status(404).json({ message: "메뉴가 존재하지 않습니다." });
        }
        await prisma.menus.delete({
            where: { CategoryId: +categoryId, menusId: +menusId }
        });
        return res.status(201).json({ message: "삭제되었습니다." });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "서버 오류" });
    }
});


export default router;