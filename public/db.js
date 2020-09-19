// declare db and request to use indexeddb and to use budget
let db;
const request = indexedDB.open("budget", 1);

request.onupgradeneeded = function (event) {
    // create object store called "pending" and set autoIncrement to true
    const db = event.target.result;
    db.createObjectStore("pending", { autoIncrement: true });
};

request.onsuccess = function (event) {
    db = event.target.result;
    // check if online
    if (navigator.onLine) {
        checkDatabase();
    };
};

request.onerror = function (event) {
    // log error here
    console.log(event);
};

function saveRecord(record) {
    // create a transaction on the pending db with readwrite access
    const transaction = db.transaction(["pending"], "readwrite");
    const pendingStore = transaction.objectStore("pending");

    // access pending object store
    // add record to store with add method.
    pendingStore.add(record);
};


function checkDatabase() {
    // open a transaction on pending db
    const transaction = db.transaction(["pending"], "readwrite");

    // access pending object store
    const pendingStore = transaction.objectStore("pending");

    // get all records from store and set to getAll
    const getAll = pendingStore.getAll();

    getAll.onsuccess = function () {
        // check if there is anything in indexedDB
        if (getAll.result.length > 0) {
            // api bulk post
            fetch('/api/transaction/bulk', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json',
                },
            })
                // then update screen
                .then((response) => response.json())
                // then empty the pendingStore var as all pending transactions have been submitted to MongoDB
                .then(() => {
                    const transaction = db.transaction(["pending"], "readwrite");
                    const pendingStore = transaction.objectStore("pending");
                    pendingStore.clear();
                });
        };
    };
};


// listen for app coming back online
window.addEventListener('online', checkDatabase);
