
var longestSubarray = function(nums) {
    let lengths = []
    let spaces = []
    if (nums.length == 0){
        return nums.length
    }
    let currLength = nums[0] == 1 ? 1 : 0
    let currSpace = nums[0] == 0 ? 1:0
    for (let i = 1; i < nums.length;i+=1){
        if(nums[i] == 1 && nums[i-1] == 1){
            currLength+=1
        } else if (nums[i] == 1 && nums[i-1] == 0){
            spaces.push(currSpace)
            currSpace = 0
            currLength += 1
        } else if(nums[i] == 0 && nums[i-1] == 1){
            lengths.push(currLength)
            currLength = 0
            currSpace +=1
        } else if (nums[i] == 0 && nums[i-1] == 0){
            currSpace +=1
        }
    }
    if(nums[nums.length -1] ==1){
        lengths.push(currLength)
    } else {
        spaces.push(currSpace)
    }
    let currMaxLen = Math.max(...lengths)
    for (let i = 0; i < spaces.length; i+=1){
        if (spaces[i] == 1 && nums[0] == 1){
            currMaxLen = currMaxLen < lengths[i+1] + lengths[i] ? lengths[i+1] + lengths[i] : currMaxLen
        }
        else if (spaces[i+1] == 1 && nums[0] == 0){
            currMaxLen = currMaxLen < lengths[i+1] + lengths[i] ? lengths[i+1] + lengths[i] : currMaxLen
        }
    }
    return currMaxLen
};

function main(){
    console.log(longestSubarray([0,1,1,1,0,0,1,1,0]))
}
main()