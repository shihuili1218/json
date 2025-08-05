/**
 * JSON折叠功能助手 - 只在format后执行，实现真正的折叠
 */

window.JsonFoldHelper = {
    currentTextarea: null,
    currentLines: null,
    foldedRanges: {},
    
    // 主要的添加按钮函数
    addFoldButtons: function() {
        var container = document.querySelector('.linedwrap');
        if (!container) return;
        
        var textarea = container.querySelector('textarea');
        var linesDiv = container.querySelector('.lines');
        
        if (!textarea || !linesDiv) return;
        
        this.currentTextarea = textarea;
        var content = textarea.value;
        if (!content || content.trim().length === 0) return;
        
        this.currentLines = content.split('\n');
        this.foldedRanges = {}; // 重置折叠状态
        
        // 清除现有按钮
        var existingButtons = linesDiv.querySelectorAll('.fold-btn');
        existingButtons.forEach(function(btn) { btn.remove(); });
        
        // 查找可折叠的范围
        var foldableRanges = this.findFoldableRanges(this.currentLines);
        
        setTimeout(function() {
            JsonFoldHelper.addButtonsToLines(linesDiv, foldableRanges);
        }, 100);
    },
    
    // 查找可折叠的范围（对象和数组）
    findFoldableRanges: function(lines) {
        var ranges = [];
        var stack = [];
        
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();
            
            if (line.endsWith('{')) {
                stack.push({ start: i, type: 'object' });
            } else if (line.endsWith('[')) {
                stack.push({ start: i, type: 'array' });
            } else if (line === '}' || line === '},') {
                if (stack.length > 0) {
                    var range = stack.pop();
                    if (range.type === 'object') {
                        ranges.push({
                            start: range.start,
                            end: i,
                            type: 'object'
                        });
                    }
                }
            } else if (line === ']' || line === '],') {
                if (stack.length > 0) {
                    var range = stack.pop();
                    if (range.type === 'array') {
                        ranges.push({
                            start: range.start,
                            end: i,
                            type: 'array'
                        });
                    }
                }
            }
        }
        
        return ranges;
    },
    
    // 为行号添加按钮
    addButtonsToLines: function(linesDiv, foldableRanges) {
        var lineNumbers = linesDiv.querySelectorAll('.lineno');
        
        foldableRanges.forEach(function(range, rangeIndex) {
            var lineDiv = lineNumbers[range.start];
            if (lineDiv) {
                var btn = document.createElement('span');
                btn.className = 'fold-btn';
                btn.innerHTML = '−';
                btn.style.cssText = 'cursor:pointer; margin-right:3px; color:#333; font-size:12px; font-weight:bold; background:#ddd; padding:0 2px; border-radius:2px;';
                btn.title = '点击折叠';
                btn.setAttribute('data-range', rangeIndex);
                
                btn.onclick = function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    JsonFoldHelper.toggleFold(rangeIndex, foldableRanges);
                };
                
                lineDiv.insertBefore(btn, lineDiv.firstChild);
            }
        });
    },
    
    // 切换折叠状态并实现真正的折叠
    toggleFold: function(rangeIndex, foldableRanges) {
        var range = foldableRanges[rangeIndex];
        var isCurrentlyFolded = this.foldedRanges[rangeIndex];
        var button = document.querySelector('.fold-btn[data-range="' + rangeIndex + '"]');
        
        if (!range || !button) return;
        
        if (isCurrentlyFolded) {
            // 展开
            this.expandRange(range);
            button.innerHTML = '−';
            button.title = '点击折叠';
            button.style.background = '#ddd';
            this.foldedRanges[rangeIndex] = false;
        } else {
            // 折叠
            this.foldRange(range);
            button.innerHTML = '+';
            button.title = '点击展开';
            button.style.background = '#bbb';
            this.foldedRanges[rangeIndex] = true;
        }
    },
    
    // 折叠指定范围
    foldRange: function(range) {
        if (!this.currentTextarea || !this.currentLines) return;
        
        var newLines = this.currentLines.slice();
        var startLine = newLines[range.start];
        
        // 创建折叠后的内容
        if (range.type === 'object') {
            newLines[range.start] = startLine.replace('{', '{...}');
        } else {
            newLines[range.start] = startLine.replace('[', '[...]');
        }
        
        // 隐藏中间的行（将它们替换为空字符串）
        for (var i = range.start + 1; i <= range.end; i++) {
            newLines[i] = '';
        }
        
        // 更新textarea内容
        this.currentTextarea.value = newLines.filter(function(line) {
            return line !== '';
        }).join('\n');
        
        // 触发linedtextarea更新
        if (this.currentTextarea.onkeyup) {
            this.currentTextarea.onkeyup();
        }
    },
    
    // 展开指定范围
    expandRange: function(range) {
        if (!this.currentTextarea || !this.currentLines) return;
        
        // 恢复原始内容
        this.currentTextarea.value = this.currentLines.join('\n');
        
        // 恢复其他已折叠的范围
        var self = this;
        Object.keys(this.foldedRanges).forEach(function(key) {
            if (key != range && self.foldedRanges[key]) {
                // 这里可以重新应用其他折叠，暂时简化
            }
        });
        
        // 触发linedtextarea更新
        if (this.currentTextarea.onkeyup) {
            this.currentTextarea.onkeyup();
        }
    }
};