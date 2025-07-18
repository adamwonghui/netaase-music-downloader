list = []
start = int(input("请输入起始值"))
end = int(input("请输入结束值"))
for i in range (start,end+1):
    Flag = False
    for q in range(2,i):
        if i % q ==0:
            Flag = True
            break
    if Flag:
        print(f"{i}是合数")
    else:
        print(f"找到了，{i}是素数")
              