import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import { createPinia } from "pinia";
import "./access";
import Antd from "ant-design-vue";
import "ant-design-vue/dist/reset.css";

const pinia = createPinia();

createApp(App).use(pinia).use(Antd).use(router).mount("#app");

const debounce = (fn:any, delay:any) => {
    let timer:any;
    return (...args:any[]) => {
        if (timer) {
            clearTimeout(timer);
        }
        timer = setTimeout(() => {
            fn(...args);
        }, delay);
    };
};
const _ResizeObserver = window.ResizeObserver;
window.ResizeObserver = class ResizeObserver extends _ResizeObserver {
    constructor(callback:any) {
        callback = debounce(callback, 200);
        super(callback);
    }
};
