from browser import document
from browser import html
from browser import svg

class node():
	def __init__(self, data):
		self.data = data
		self.parent = None
		self.children = []

	def siblings(self):
		if(self.parent is not None):
			return len(self.parent.children)
		else:
			return 1

	def siblingIndex(self):
		if(self.parent is not None):
			return self.parent.children.index(self)
		else:
			return 0

	def level(self):
		if(self.parent is not None):
			return self.parent.level() + 1
		else:
			return 1

	def removeFromParent(self):
		self.parent = None

	def addChild(self, child):
		self.children.append(child)
		child.parent = self

def nodeToSVG(aNode, width, padding):
	i = aNode.siblingIndex()
	j = aNode.level()

	widthToUse = width - padding
	height = 50

	x = i * width
	y = 300 - (j * (height + padding))

	container = svg.g()

	container <= svg.rect(
		id="rect_[{0}][{1}]".format(i, j),
		x=x,
		y=y,
		width=widthToUse,
		height=height,
		fill="blue")

	container <= svg.text(
		aNode.data,
		id="text_[{0}][{1}]",
		x=x,
		y=y,
		font_size="22",
		stroke_color="black")

	return container


def treeToSVG(rootNode, rootDOM, startingWidth, padding):
	# outputs in post-order

	# we calculate the expected width for the next element here because it saves having to look up
	# the parent later
	numChildren = len(rootNode.children)
	nextWidth = startingWidth
	if(numChildren > 0):
		nextWidth = startingWidth / numChildren

	for child in rootNode.children:
		# group the children with the parent
		rootDOM <= treeToSVG(child, rootDOM, nextWidth, padding)
	rootDOM <= nodeToSVG(rootNode, startingWidth, padding)
	return nodeToSVG(rootNode, nextWidth, padding)

myTree = node('root')
branch = node('branch')
leaf = node('leafUnderBranch')
leaf1 = node('leaf1')
leaf2 = node('leaf2')
leaf3 = node('leafalsounderbranch')

branch.addChild(leaf3)
branch.addChild(leaf)
myTree.addChild(branch)
myTree.addChild(leaf1)
myTree.addChild(leaf2)

print(branch.siblings())
print(branch.level())

panel = document['panel']
treeToSVG(myTree, panel, 1000, 20)

# to see what attributes a given object has
#for a in document["theOneSVG"].attributes:
#	print(a.nodeName, a.value)