class UnixDate{
    unixTimestamp = 0
    constructor(){
        this.unixTimestamp = Math.floor(Date.now() / 1000);
    }

    getCurrentDate(){
        return this.unixTimestamp
    }
    getNextDayDate(){
        return this.unixTimestamp + 3600
    }

    getDateNsecondsAgo(n){
        return this.unixTimestamp  - n
    }

    getFormattedDate(unixTime) {
        
        const date = new Date(unixTime * 1000);
        
        return date.toUTCString();
    }

    getISOWithTimeZone(unixTime, timeZoneOffset = '+03:00') {
        
        const date = new Date(unixTime  * 1000 );

        
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0'); 
        const day = String(date.getUTCDate()).padStart(2, '0');
        const hours = String(date.getUTCHours()).padStart(2, '0');
        const minutes = String(date.getUTCMinutes()).padStart(2, '0');
        const seconds = String(date.getUTCSeconds()).padStart(2, '0');

        
        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${timeZoneOffset}`;
    }

    getShortedDate(unixTime){
        const date = new Date(unixTime  * 1000 );

        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0'); 
        const day = String(date.getUTCDate()).padStart(2, '0');

        return `${year}${month}${day}`;
    }

}

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

let unixDateInstace = new UnixDate()
module.exports = {
    addYearsToDate,
    subtractYearsFromDate,
    UnixDate,
    unixDate: unixDateInstace
}