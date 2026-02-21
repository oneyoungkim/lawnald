
export function humanizeTitle(filename: string): string {
    if (!filename) return "";
    // Remove extensions
    let title = filename.replace(/\.(pdf|docx|txt)$/i, '');
    // Replace underscores and hyphens with spaces
    title = title.replace(/[_\-]/g, ' ');
    // Remove leading/trailing spaces
    return title.trim();
}

export function formatDate(dateStr: string): string {
    if (!dateStr) return "";
    try {
        const date = new Date(dateStr);
        return new Intl.DateTimeFormat('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(date);
    } catch (e) {
        return dateStr;
    }
}
