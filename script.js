// --- DOM Elements ---
const dropZone = document.getElementById("drop-zone");
const fileInput = document.getElementById("file-input");
const uploadStatus = document.getElementById("upload-status");
const shareCodeInput = document.getElementById("share-code-input");
const getBtn = document.getElementById("get-btn");
const downloadStatus = document.getElementById("download-status");

// --- Event Listeners ---

// 1. Click to Upload
dropZone.addEventListener("click", () => fileInput.click());

// 2. Drag & Drop Visual Effects
dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("active");
});

dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("active");
});

dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("active");
    // Handle the file drop
    if (e.dataTransfer.files.length) {
        handleUpload(e.dataTransfer.files[0]);
    }
});

// 3. File Input Change
fileInput.addEventListener("change", () => {
    if (fileInput.files.length) {
        handleUpload(fileInput.files[0]);
    }
});

// 4. Download Button Click
getBtn.addEventListener("click", handleGetFile);


// --- Functions ---

async function handleUpload(file) {
    // UI Loading State
    uploadStatus.innerHTML = `<span style="color:#aaa;">Uploading ${file.name}...</span>`;
    
    const form = new FormData();
    form.append("file", file);

    try {
        // NOTE: This fetch assumes you have a backend running at /upload
        const res = await fetch("/upload", { method: "POST", body: form });
        
        if (!res.ok) throw new Error("Upload Failed");
        
        const data = await res.json();
        
        // Success Message
        uploadStatus.innerHTML = `
            <span style="color:#00ff88;">✅ Upload Success!</span><br>
            Code: <strong style="font-size:1.2rem; color: #fff;">${data.code}</strong>
        `;
    } catch (error) {
        console.error(error);
        uploadStatus.innerHTML = `<span style="color:#ff4b4b;">❌ Error: Server not connected.</span>`;
    }
}

async function handleGetFile() {
    const code = shareCodeInput.value.trim();
    if (!code) {
        downloadStatus.innerHTML = '<span style="color:#ff4b4b;">Please enter a code</span>';
        return;
    }

    downloadStatus.innerHTML = '<span style="color:#aaa;">Searching...</span>';

    try {
        // NOTE: This fetch assumes you have a backend running at /get
        const res = await fetch("/get", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code })
        });

        const data = await res.json();
        
        if (data.link) {
            downloadStatus.innerHTML = `<a href="${data.link}" target="_blank">⬇️ Download File Now</a>`;
        } else {
            downloadStatus.innerHTML = `<span style="color:#ff4b4b;">❌ Invalid Code</span>`;
        }
    } catch (error) {
        console.error(error);
        downloadStatus.innerHTML = `<span style="color:#ff4b4b;">❌ Error retrieving file.</span>`;
    }
}