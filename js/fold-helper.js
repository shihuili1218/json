/**
 * JSON折叠功能助手 - 实现对象和数组的展开/折叠功能
 * 改进版：支持多个同时折叠，保留原始数据，不修改textarea内容
 */

window.JsonFoldHelper = {
    originalContent: '',
    originalLines: [],
    foldedRanges: new Set(),
    allRanges: [],
    container: null,
    textarea: null,
    linesDiv: null,

    // 主要的添加按钮函数
    addFoldButtons: function() {
        this.container = document.querySelector('.linedwrap');
        if (!this.container) return;

        this.textarea = this.container.querySelector('textarea');
        this.linesDiv = this.container.querySelector('.lines');

        if (!this.textarea || !this.linesDiv) return;

        var content = this.textarea.value;
        if (!content || content.trim().length === 0) return;

        // 保存原始内容
        this.originalContent = content;
        this.originalLines = content.split('\n');
        this.foldedRanges.clear();

        // 清除现有按钮
        var existingButtons = this.linesDiv.querySelectorAll('.fold-btn');
        existingButtons.forEach(function(btn) { btn.remove(); });

        // 查找可折叠的范围
        this.allRanges = this.findFoldableRanges(this.originalLines);

        var self = this;
        setTimeout(function() {
            self.addButtonsToLines();
        }, 100);
    },

    // 查找可折叠的范围（对象和数组）
    findFoldableRanges: function(lines) {
        var ranges = [];
        var stack = [];

        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            var trimmed = line.trim();

            // 检测对象或数组的开始
            if (trimmed.endsWith('{') || trimmed.match(/:\s*\{$/)) {
                stack.push({ start: i, type: 'object', indent: line.search(/\S/) });
            } else if (trimmed.endsWith('[') || trimmed.match(/:\s*\[$/)) {
                stack.push({ start: i, type: 'array', indent: line.search(/\S/) });
            }
            // 检测对象的结束
            else if (trimmed === '}' || trimmed === '},') {
                if (stack.length > 0 && stack[stack.length - 1].type === 'object') {
                    var range = stack.pop();
                    // 只添加多行的范围（至少2行）
                    if (i - range.start >= 1) {
                        ranges.push({
                            start: range.start,
                            end: i,
                            type: 'object',
                            indent: range.indent
                        });
                    }
                }
            }
            // 检测数组的结束
            else if (trimmed === ']' || trimmed === '],') {
                if (stack.length > 0 && stack[stack.length - 1].type === 'array') {
                    var range = stack.pop();
                    // 只添加多行的范围（至少2行）
                    if (i - range.start >= 1) {
                        ranges.push({
                            start: range.start,
                            end: i,
                            type: 'array',
                            indent: range.indent
                        });
                    }
                }
            }
        }

        return ranges;
    },

    // 为行号添加按钮
    addButtonsToLines: function() {
        var lineNumbers = this.linesDiv.querySelectorAll('.lineno');
        var self = this;

        this.allRanges.forEach(function(range, rangeIndex) {
            var lineDiv = lineNumbers[range.start];
            if (lineDiv) {
                var btn = document.createElement('span');
                btn.className = 'fold-btn';
                btn.innerHTML = '−';
                btn.style.cssText = 'cursor:pointer; margin-right:3px; color:#666; font-size:14px; font-weight:bold; user-select: none; display: inline-block; width: 14px; text-align: center;';
                btn.title = '点击折叠';
                btn.setAttribute('data-range-index', rangeIndex);
                btn.setAttribute('data-line-index', range.start);

                btn.onclick = function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    self.toggleFold(rangeIndex);
                };

                lineDiv.insertBefore(btn, lineDiv.firstChild);
            }
        });
    },

    // 切换折叠状态
    toggleFold: function(rangeIndex) {
        var isFolded = this.foldedRanges.has(rangeIndex);

        if (isFolded) {
            this.foldedRanges.delete(rangeIndex);
        } else {
            this.foldedRanges.add(rangeIndex);
        }

        this.updateDisplay();
    },

    // 更新显示内容
    updateDisplay: function() {
        if (!this.textarea || !this.originalLines) return;

        // 创建一个映射来标记哪些行应该被隐藏
        var hiddenLines = new Set();
        var self = this;

        // 收集所有需要隐藏的行
        this.foldedRanges.forEach(function(rangeIndex) {
            var range = self.allRanges[rangeIndex];
            if (range) {
                // 隐藏从 start+1 到 end 的所有行
                for (var i = range.start + 1; i <= range.end; i++) {
                    hiddenLines.add(i);
                }
            }
        });

        // 构建新的显示内容和原始行号映射
        var newLines = [];
        var displayLineToOriginalLine = {}; // 显示行号 -> 原始行号
        var displayLineIndex = 0;

        for (var i = 0; i < this.originalLines.length; i++) {
            if (hiddenLines.has(i)) {
                continue; // 跳过被折叠的行
            }

            var line = this.originalLines[i];

            // 如果这是一个折叠范围的开始行，添加折叠标记
            var isFoldStart = false;
            self.foldedRanges.forEach(function(rangeIndex) {
                var range = self.allRanges[rangeIndex];
                if (range && range.start === i) {
                    isFoldStart = true;
                    var trimmed = line.trimRight();
                    // 移除末尾的 { 或 [，添加折叠标记
                    if (range.type === 'object') {
                        line = trimmed.replace(/\{\s*$/, '{ ... }');
                    } else {
                        line = trimmed.replace(/\[\s*$/, '[ ... ]');
                    }
                }
            });

            newLines.push(line);
            displayLineToOriginalLine[displayLineIndex] = i;
            displayLineIndex++;
        }

        this.textarea.value = newLines.join('\n');

        // 触发更新
        var textarea = this.textarea;
        if (textarea.onkeyup) {
            textarea.onkeyup();
        }

        // 等待行号更新后，重新添加按钮
        setTimeout(function() {
            self.reAddButtons(displayLineToOriginalLine);
        }, 50);
    },

    // 重新添加所有折叠按钮
    reAddButtons: function(displayLineToOriginalLine) {
        if (!this.linesDiv) return;

        var self = this;

        // 清除所有现有按钮
        var existingButtons = this.linesDiv.querySelectorAll('.fold-btn');
        existingButtons.forEach(function(btn) { btn.remove(); });

        // 获取当前的行号元素
        var lineNumbers = this.linesDiv.querySelectorAll('.lineno');

        // 遍历所有可见的行号，添加对应的按钮
        lineNumbers.forEach(function(lineDiv, displayIndex) {
            var originalLineIndex = displayLineToOriginalLine[displayIndex];

            // 检查这个原始行是否有折叠按钮
            self.allRanges.forEach(function(range, rangeIndex) {
                if (range.start === originalLineIndex) {
                    // 检查这个范围是否应该显示（不在其他折叠范围内）
                    var shouldShow = true;
                    self.foldedRanges.forEach(function(foldedIndex) {
                        var foldedRange = self.allRanges[foldedIndex];
                        if (foldedRange && foldedIndex !== rangeIndex) {
                            // 如果当前范围在某个已折叠范围内，不显示按钮
                            if (range.start > foldedRange.start && range.end <= foldedRange.end) {
                                shouldShow = false;
                            }
                        }
                    });

                    if (shouldShow) {
                        var btn = document.createElement('span');
                        btn.className = 'fold-btn';
                        var isFolded = self.foldedRanges.has(rangeIndex);
                        btn.innerHTML = isFolded ? '+' : '−';
                        btn.style.cssText = 'cursor:pointer; margin-right:3px; color:' + (isFolded ? '#999' : '#666') + '; font-size:14px; font-weight:bold; user-select: none; display: inline-block; width: 14px; text-align: center; line-height: 1.2; vertical-align: baseline;';
                        btn.title = isFolded ? '点击展开' : '点击折叠';
                        btn.setAttribute('data-range-index', rangeIndex);

                        btn.onclick = function(e) {
                            e.preventDefault();
                            e.stopPropagation();
                            self.toggleFold(rangeIndex);
                        };

                        lineDiv.insertBefore(btn, lineDiv.firstChild);
                    }
                }
            });
        });
    },

    // 展开全部
    expandAll: function() {
        this.foldedRanges.clear();
        this.updateDisplay();
    },

    // 折叠全部
    foldAll: function() {
        var self = this;
        this.allRanges.forEach(function(range, index) {
            self.foldedRanges.add(index);
        });
        this.updateDisplay();
    },

    // 折叠到指定层级
    foldToLevel: function(level) {
        this.foldedRanges.clear();
        var self = this;

        // 根据缩进层级折叠
        this.allRanges.forEach(function(range, index) {
            var indentLevel = Math.floor(range.indent / 2); // 假设每层缩进2个空格
            if (indentLevel >= level) {
                self.foldedRanges.add(index);
            }
        });

        this.updateDisplay();
    }
};