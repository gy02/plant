//取消form的action跳转
//submit按钮先进行表单验证
//表单全部非空之后，将newPlant插入syncIDB与IDB
//之后在sw中的sync事件 实现addPlantToServer
function showAddPlantNotification(){
    navigator.serviceWorker.ready
        .then(function (serviceWorkerRegistration) {
            serviceWorkerRegistration.showNotification("Plant App",
                {
                    body: "Plant added!",
                    icon: '/images/icon.webp'})
                .then(r =>
                    console.log(r)
                );
        });
}

var photo, base64Image
function checkForm(form){
    // 检查是否至少有一个单选按钮被选中
    const flowersYes = document.getElementById('flowersYes');
    const flowersNo = document.getElementById('flowersNo');
    if (!(flowersYes.checked || flowersNo.checked )) {
        alert('Please select whether the plant has flowers.');
        flowersYes.focus()
        return false; // 防止表单提交
    }
    if (!selectSunExposure()){
        alert('Please choose the Sun Exposure.');
        const sunExposure=document.getElementById("sunExposure")
        sunExposure.focus()
        return false; // 防止表单提交
    }
    const color=document.getElementById("flowerColor")
    if (color.value==null || color.value===""){
        alert('Please choose the color.');
        color.focus()
        return false; // 防止表单提交
    }
    const complete = document.getElementById('statusComplete');
    const inProgress = document.getElementById('statusInProgress');
    if (!(complete.checked || inProgress.checked )) {
        alert('Please select the status of the identification.');
        complete.focus()
        return false; // 防止表单提交
    }
    // if (getMarker()==null){
    //     alert('Please select the location');
    //     const map=document.getElementById('map')
    //     map.focus()
    //     return; // 防止表单提交
    // }
    //限制图片大小
    photo = form.elements['photo'].files[0];
    var fileSize=photo.size;
    console.log("file size: "+fileSize/(1024*1024)+"MB");
    if((fileSize/(1024*1024))>4){
        alert("Plant Image cannot exceed 4MB");
        return false;
    }
    return true
}

async function changeFormToObj(form) {
    console.log('run changeFormToObj()')

    let formData = new FormData(form);

    formData.set('plantId',createPlantId(formData.get('plantName')))
    formData = await changeImageFormat(formData);

    const formObject = {};
    formData.forEach((value, key) => {
        formObject[key] = value;
        // console.log(`${key}: ${value}`)
    });
    // console.log(formData)
    return formObject;
}

async function changeImageFormat(formData) {
    console.log('run changeImageFormat()')
    return new Promise((resolve, reject) => {
        if (photo) {
            const reader = new FileReader();
            reader.onload = function(e) {
                base64Image = e.target.result;
                formData.append("base64Image", base64Image);
                formData.delete("photo");
                resolve(formData);
            };
            reader.onerror = function(error) {
                reject(error);
            };
            reader.readAsDataURL(photo);
        } else {
            // 如果没有图片，直接返回 formData
            resolve(formData);
        }
    });
}

function mySubmit(form){
    console.log("ready to submit: "+form)
    //做表单验证（非空+限制图片大小）
    if (checkForm(form)){
        console.log('处理表单')
        changeFormToObj(form).then(plantObj=>{
            console.log(plantObj)
            if (plantObj!=null){
                console.log('plantObj!=null')
                // const plants=[plantObj]
                openPlantIDB().then(IDB=>{
                    console.log('add new plant to IDB')
                    addNewPlantsToIDB(IDB,[plantObj])
                    addNewPlantToSync(IDB,plantObj)
                }).catch(err=>{
                    console.log('err: '+err)
                }).finally(()=>{
                    console.log('finally')
                    alert('submit successfully')
                    showAddPlantNotification()
                    // console.log("current plant id: "+plantObj.plantId);
                    setPlantId(plantObj.plantId)
                    window.location.href="/detail";
                    return true
                })
            }else {
                console.log('plantObj==null')
            }

        })
    }else {
        console.log('有空值')
        return false
    }
    return false
}

function selectSunExposure(){
    const select = document.querySelector('.sun');
    const reset = document.querySelector('.sun option:nth-child(2)');
    const select_index = select.selectedIndex;
    console.log("select_index: "+select_index)
    return select_index !== 0;

}

// Synchronize the text field with the color picker
function updateFlowerColor() {
    const colorPicker = document.getElementById('flowerColorPicker');
    const colorText = document.getElementById('flowerColor');
    colorText.value = colorPicker.value;
}

document.getElementById('photo').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = document.getElementById('uploadedImage');
            img.src = e.target.result;
            img.style.display = 'block';  // Ensure the image is visible
        };
        reader.readAsDataURL(file);
    }
});
