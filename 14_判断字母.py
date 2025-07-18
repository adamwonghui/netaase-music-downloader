# 判断用户输入是否是字母
s = input("请输入一个字符:")
if s.isalpha():
    print(f" {s} 是字母")
else:
    print(f"{s} 不是字母")