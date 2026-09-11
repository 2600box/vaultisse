"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupTestApp = setupTestApp;
const AppService_1 = require("../../src/AppService");
function setupTestApp() {
    beforeAll(() => {
        AppService_1.appService.init();
    });
    afterAll(() => __awaiter(this, void 0, void 0, function* () {
        yield new Promise((resolve) => { var _a; return (_a = AppService_1.appService.getServer()) === null || _a === void 0 ? void 0 : _a.close(() => resolve()); });
        yield AppService_1.appService.getDatabasePool().end();
    }));
    return AppService_1.appService.getApp();
}
//# sourceMappingURL=testApp.js.map