/*
Copyright (c) 2012, Sid Nallu, Chris Umbel

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

/*
 * contribution by sidred123
 */

/*
 * Compute the Levenshtein distance between two strings.
 * Algorithm based from Speech and Language Processing - Daniel Jurafsky and James H. Martin.
 */
 
/* 
 Contribution by manvesh -
    Bias for misspellings due to typing adjacent letters on QWERTY/Generic keyboard.
    Include keyboard descriptor object to internationalize this part.
    - For example: "Tedt" will be closer to "Test" than "Tent". 
    
*/

function LevenshteinDistance (source, target, options) {
    options = options || {};
    options.insertion_cost = options.insertion_cost || 1;
    options.deletion_cost = options.deletion_cost || 1;
    options.substitution_cost = options.substitution_cost || 2;
    
    // If usekeyboardmodel is true, then 
    // - insertion_cost = option.insertion_cost/2 if the key is in vicinity, or option.insertion_cost otherwise.
    // - substitution_cost = option.substitution_cost/2 if the key is in vicinity of other key, or option.substitution_cost otherwise.  
    options.usekeyboardmodel = !!options.usekeyboardmodel;
    
    if (options.usekeyboardmodel) {
        this.keyboardModel = new KeyboardModel();
    }
    
    var sourceLength = source.length;
    var targetLength = target.length;
    var distanceMatrix = [[0]];

    for (var row =  1; row <= sourceLength; row++) {
        distanceMatrix[row] = [];
        distanceMatrix[row][0] = distanceMatrix[row-1][0] + options.deletion_cost;
    }

    for (var column = 1; column <= targetLength; column++) {
        distanceMatrix[0][column] = distanceMatrix[0][column-1] + options.insertion_cost;
    }

    for (var row = 1; row <= sourceLength; row++) {
        for (var column = 1; column <= targetLength; column++) {
            var costToInsert = distanceMatrix[row][column-1] + options.insertion_cost;
            var costToDelete = distanceMatrix[row-1][column] + options.deletion_cost;
            
            var sourceElement = source[row-1];
            var targetElement = target[column-1];
            var costToSubstitute = distanceMatrix[row-1][column-1];
            
            if (options.usekeyboardmodel) {
                if (this.keyboardModel.areNeighbors(source[row], target[column-1])) {
                    costToInsert = distanceMatrix[row][column-1] + options.insertion_cost/3;
                }
            }
            
            if (sourceElement !== targetElement) {
                if (options.usekeyboardmodel && this.keyboardModel.areNeighbors(sourceElement, targetElement)) {
                    costToSubstitute = costToSubstitute + options.substitution_cost/3;
                } else {
                    costToSubstitute = costToSubstitute + options.substitution_cost;                    
                }
            }
            distanceMatrix[row][column] = Math.min(costToInsert, costToDelete, costToSubstitute);
        }
    }
    console.log("Lev(", source,", ", target,", ", options.usekeyboardmodel, ") = ", distanceMatrix[sourceLength][targetLength]);
    return distanceMatrix[sourceLength][targetLength];
}

function KeyboardModel(keysArray) {
    const delimiter = "\3";
    if (!keysArray) {
        keysArray = [ ["`1234567890-=", "~!@#$%^&*()_+"], 
                           ["\3qwertyuiop[]\\", "\3QWERTYUIOP{}|"],
                           ["\3asdfghjkl;'", "\3ASDFGHJKL:"], 
                           ["\3zxcvbnm,./","\3\3ZXCVBNM<>?"],
                           ["\3\3\3\3    "]];
    }
    
    this.adjKeys = {};
    try {
        for (var i=0; i < keysArray.length; i++) {
            for (var j=0; j<keysArray[i].length; j++) {
                var keys = keysArray[i][j].split("");
                for (var k = 0; k<keys.length; k++) {
                    if (!this.adjKeys[keys[k]] && this.adjKeys[keys[k]] !== delimiter && keys[k] !== "") {
                        this.adjKeys[keys[k]] = {};
                        if (k>0 && this.adjKeys[keys[k]]!== this.adjKeys[keys[k-1]] && keys[k-1] !== delimiter) {
                            this.adjKeys[keys[k]][keys[k-1]] = "left";
                        }
                        if (k<keys.length-1 && this.adjKeys[keys[k]]!== this.adjKeys[keys[k+1]] && keys[k+1] !== delimiter ) {
                            this.adjKeys[keys[k]][keys[k+1]] = "right";
                        }
                    }
                }
                
                // Below First line of characters 
                if (i>0) {
                    if (keysArray[i-1][j]) {
                        var prevLineKeys = keysArray[i-1][j].split("");
                        for (var k=0; k < keys.length; k++) {
                            if (k < (prevLineKeys.length) && this.adjKeys[keys[k]] !== delimiter) {
                                if (prevLineKeys[k] !== delimiter) {
                                    this.adjKeys[keys[k]][prevLineKeys[k]] = "above";    
                                }
                                if (k>0 && (k-1)<prevLineKeys.length && prevLineKeys[k-1] !== delimiter) {
                                    this.adjKeys[keys[k]][prevLineKeys[k-1]] = "above-left";
                                }
                                if (k<keys.length-1 && (k+1)<prevLineKeys.length && prevLineKeys[k+1] !== delimiter) {
                                    this.adjKeys[keys[k]][prevLineKeys[k+1]] = "above-right";
                                }
                            }
                        }
                    }
                }
                
                // Above last line of characters
                if (i<keysArray.length-1) {
                    if (keysArray[i+1][j]) {
                        var nextLineKeys = keysArray[i+1][j].split("");
                    }
                    for (var k=0; k < keys.length; k++) {
                        if (k < (nextLineKeys.length) && this.adjKeys[keys[k]] !== delimiter) {
                            if (nextLineKeys[k] !== delimiter) {
                                this.adjKeys[keys[k]][nextLineKeys[k]] = "below";    
                            }
                            if (k>0 && (k-1)<nextLineKeys.length && nextLineKeys[k-1] !== delimiter) {
                                this.adjKeys[keys[k]][nextLineKeys[k-1]] = "below-left";
                            }
                            if (k<keys.length-1 && (k+1)<nextLineKeys.length && nextLineKeys[k+1] !== delimiter) {
                                this.adjKeys[keys[k]][nextLineKeys[k+1]] = "below-right";
                            }
                        }
                    }
                }
            }
        }
        
        delete keys;
        delete prevLineKeys;
        delete nextLineKeys;
        
    } catch(keysArrayParseError) {
        console.error("Cannot parse keysArray.");
    }
    
    /* returns true if char1 and char2 are neighbors */
    function areNeighbors(char1, char2) {
        if (!char1 || !char2) {
            return false;
        }
        if (this.adjKeys[char1] && this.adjKeys[char2]) {
            if (this.adjKeys[char1][char2]) {
                if (this.adjKeys[char2][char1]) {
                    return true;
                } else {
                    return "maybe true";
                }
            }
        } else {
            return false;
        }
    }
    return {
        adjKeys: this.adjKeys,
        areNeighbors: areNeighbors
    };
}

module.exports = LevenshteinDistance;
