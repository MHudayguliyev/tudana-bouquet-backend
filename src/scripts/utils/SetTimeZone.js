const SetTimeZone = (d, target) => { 
    if(target && !target == ''){
        return new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours() + 5, d.getMinutes(), d.getSeconds())
    }
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours() - 5, d.getMinutes(), d.getSeconds())
}

module.exports = SetTimeZone