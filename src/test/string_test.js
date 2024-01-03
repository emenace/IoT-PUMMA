str = "30 day"

let matches = str.match(/(\d+)/);
let matches2 = str.match(/\b\w{3,}\b/g);
console.log(matches[0]);
console.log(matches2[0]);

if ((str.includes("month")) || ((matches[0]>7) && (matches2[0] === "day"))){
    console.log("months value ");
} else if(str.includes("week")){
    console.log("week value");
} else if(str.includes("day")){
    console.log("day value");
}

if (matches2[0] === 'day'){
    console.log("month test");
}