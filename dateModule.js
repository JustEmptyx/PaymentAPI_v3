function addYearsToDate(date, years) {
    const resultDate = new Date(date);
    resultDate.setFullYear(resultDate.getFullYear() + years);
    return formatDate(resultDate);
}

function subtractYearsFromDate(date, years) {
    const resultDate = new Date(date);
    resultDate.setFullYear(resultDate.getFullYear() - years);
    return formatDate(resultDate);
}

function formatDate(date) {
    const year = date.getFullYear();
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const day = ('0' + date.getDate()).slice(-2);
    return `${year}-${month}-${day}`;
}

module.exports = {
    addYearsToDate,
    subtractYearsFromDate
}