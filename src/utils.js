
export function formatTimestampToUTC(date) {
    const year = date.getUTCFullYear();
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = date.getUTCDate().toString().padStart(2, '0');
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    return `${year}${month}${day}${hours}${minutes}`;
}

export function rectifyToFiveMinutes(date) {
    const minutes = date.getUTCMinutes();
    const rectifiedMinutes = Math.floor(minutes / 5) * 5;
    date.setUTCMinutes(rectifiedMinutes);
    date.setUTCSeconds(0);
    return date;
}
