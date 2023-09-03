class FuncUtil {

    public static debounce(func: any, delay: number) {
        let timer: number;

        return () => {
            clearTimeout(timer);
            timer = setTimeout(() => {
                func.apply(this);
            }, delay);
        };
    }

}

export default FuncUtil