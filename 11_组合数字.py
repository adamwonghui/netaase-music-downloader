# 使用“1234”可以组合不重复的3位数并打印出来。
list = []
for i in "1234":
    for j in "1234":
        for k in "1234":
            if i != j and i != k and j != k:           
                list.append(int(i+j+k))
for item in set(list):# set函数用于列表去重
    print(item)
print(item)       