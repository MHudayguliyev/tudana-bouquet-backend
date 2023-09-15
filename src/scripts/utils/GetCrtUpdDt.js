const GetCrtUpdDt = () => {
    const dt = new Date()
    const padL = (nr, len = 2, chr = `0`) => `${nr}`.padStart(2, chr);
    const crt_upd_dt = `${padL(dt.getFullYear())}-${padL(dt.getMonth()+1)}-${dt.getDate()} ${padL(dt.getHours())}:${ padL(dt.getMinutes())}:${padL(dt.getSeconds())}`

    return crt_upd_dt
}

module.exports = GetCrtUpdDt