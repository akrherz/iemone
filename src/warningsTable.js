import strftime from 'strftime';

export function setupWarningsTable(tableElement, warningsLayer) {
    function updateTable(features) {
        const tbody = tableElement.querySelector('tbody');
        tbody.innerHTML = ''; // Clear existing rows

        features.forEach((feature) => {
            const row = document.createElement('tr');
            const wfoCell = document.createElement('td');
            wfoCell.textContent = feature.get('wfo');
            row.appendChild(wfoCell);

            const tillCell = document.createElement('td');
            const expireUTC = new Date(feature.get('expire_utc'));
            tillCell.textContent = strftime("%Y-%m-%d %H:%M", expireUTC);
            row.appendChild(tillCell);

            const linkCell = document.createElement('td');
            linkCell.innerHTML = `<a href="${feature.get('href')}" target="_new">${feature.get('phenomena')}.${feature.get('significance')} ${feature.get('eventid')}</a>`;
            row.appendChild(linkCell);

            tbody.appendChild(row);
        });
    }

    warningsLayer.getSource().on('change', () => {
        if (warningsLayer.getSource().getState() === 'ready') {
            const features = warningsLayer.getSource().getFeatures();
            updateTable(features);
        }
    });
}
